package es.diapason.agenda;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Prepara un correo en la app de correo del profesor (Gmail, Outlook…) con destinatarios,
 * asunto, texto y adjuntos. Lo envía el profesor: Diapasón no guarda cuentas ni contraseñas.
 */
@CapacitorPlugin(name = "Correo")
public class CorreoPlugin extends Plugin {

    private static String[] lista(JSArray a) {
        List<String> out = new ArrayList<>();
        if (a != null) {
            for (int i = 0; i < a.length(); i++) {
                String s = a.optString(i, "").trim();
                if (!s.isEmpty()) out.add(s);
            }
        }
        return out.toArray(new String[0]);
    }

    @PluginMethod
    public void redactar(PluginCall call) {
        String[] para = lista(call.getArray("para"));
        String[] cco = lista(call.getArray("cco"));
        String asunto = call.getString("asunto", "");
        String texto = call.getString("texto", "");
        String[] archivos = lista(call.getArray("archivos"));

        ArrayList<Uri> uris = new ArrayList<>();
        String autoridad = getContext().getPackageName() + ".fileprovider";
        for (String a : archivos) {
            try {
                File f = new File(Uri.parse(a).getPath());
                if (f.exists()) uris.add(FileProvider.getUriForFile(getContext(), autoridad, f));
            } catch (Exception ignored) {
                // si un adjunto falla, el correo sale igualmente con el resto
            }
        }

        Intent intent;
        if (uris.isEmpty()) {
            // Sin adjuntos: solo apps de correo
            intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:"));
        } else {
            intent = new Intent(uris.size() == 1 ? Intent.ACTION_SEND : Intent.ACTION_SEND_MULTIPLE);
            intent.setType("message/rfc822");
            if (uris.size() == 1) intent.putExtra(Intent.EXTRA_STREAM, uris.get(0));
            else intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris);
            ClipData clip = ClipData.newRawUri("", uris.get(0));
            for (int i = 1; i < uris.size(); i++) clip.addItem(new ClipData.Item(uris.get(i)));
            intent.setClipData(clip);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
        if (para.length > 0) intent.putExtra(Intent.EXTRA_EMAIL, para);
        if (cco.length > 0) intent.putExtra(Intent.EXTRA_BCC, cco);
        intent.putExtra(Intent.EXTRA_SUBJECT, asunto);
        intent.putExtra(Intent.EXTRA_TEXT, texto);

        Intent elegir = Intent.createChooser(intent, "Enviar con…");
        elegir.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            getActivity().startActivity(elegir);
            call.resolve();
        } catch (Exception e) {
            call.reject("No hay ninguna aplicación de correo instalada");
        }
    }
}
