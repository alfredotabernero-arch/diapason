// Enviar repertorio por correo desde el correo habitual del profesor.
// Diapasón solo prepara el mensaje (destinatarios, asunto, texto con enlaces y adjuntos);
// lo envía el profesor desde su programa de correo. No se guardan cuentas ni contraseñas.
import { registerPlugin } from '@capacitor/core';
import { itemTitle } from './constants.js';
import { getFile } from './files.js';
import { deliverFile, deviceKind, isDesktop, isNative } from './platform.js';

const Correo = registerPlugin('Correo');
const MATERIAL_LABEL = { pdf: 'Partitura', video: 'Vídeo', audio: 'Audio', link: 'Enlace' };

const emailsOf = (people) => [...new Set(people.map((p) => (p.email || '').trim()).filter(Boolean))];

/**
 * Prepara el correo del repertorio.
 * people: destinatarios (un alumno o los miembros de un grupo) · items: obras/estudios/escalas
 * group: nombre del grupo (los miembros van en copia oculta)
 */
export function correoRepertorio(state, { people, items, group = '' }) {
  const { settings } = state;
  const emails = emailsOf(people);
  const sinEmail = people.filter((p) => !(p.email || '').trim());
  const single = people.length === 1 && !group;
  const titles = items.map(itemTitle);
  const subject = group
    ? `${group}: ${items.length === 1 ? titles[0] : 'repertorio'}`
    : items.length === 1 ? `Repertorio: ${titles[0]}` : `Repertorio de ${settings.subject}`;

  const ids = new Set(items.map((i) => i.id));
  const peopleIds = new Set(people.map((p) => p.id));
  const lines = [single ? `Hola, ${people[0].firstName}:` : 'Hola a todos:', ''];
  lines.push(items.length === 1 ? 'Os envío el material de la obra que vamos a trabajar:' : 'Os envío el material del repertorio que vamos a trabajar:');
  if (single) lines[2] = lines[2].replace('Os envío', 'Te envío');
  const files = [];
  for (const item of items) {
    lines.push('', `• ${itemTitle(item)}${item.composer && !itemTitle(item).includes(item.composer) ? ` — ${item.composer}` : ''}`);
    const mats = state.materials.filter((m) => m.itemId === item.id && (!m.studentId || peopleIds.has(m.studentId)));
    for (const m of mats) {
      if (m.source === 'file') {
        files.push(m);
        lines.push(`  ${MATERIAL_LABEL[m.kind] || 'Archivo'}: ${m.title} (adjunto)`);
      } else if (m.url) {
        lines.push(`  ${MATERIAL_LABEL[m.kind] || 'Enlace'}: ${m.title}`, `  ${m.url}`);
      }
    }
    // tareas pendientes del alumno con esta obra (en un grupo no: cada uno tiene las suyas)
    const tasks = group ? [] : state.tasks.filter((t) => t.itemId === item.id && !t.done && peopleIds.has(t.studentId));
    const seen = new Set();
    for (const t of tasks) {
      if (seen.has(t.title)) continue;
      seen.add(t.title);
      lines.push(`  Para casa: ${t.title}`);
    }
  }
  lines.push('', 'Un saludo,', settings.teacherName || '', settings.school || '');
  return {
    to: group ? [] : emails,
    bcc: group ? emails : [],
    subject,
    body: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    files: files.filter((m) => ids.has(m.itemId)),
    sinEmail,
  };
}

function mailtoUrl({ to, bcc, subject, body }) {
  const q = [];
  if (bcc.length) q.push(`bcc=${encodeURIComponent(bcc.join(','))}`);
  q.push(`subject=${encodeURIComponent(subject)}`);
  q.push(`body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`);
  return `mailto:${to.map(encodeURIComponent).join(',')}?${q.join('&')}`;
}

// (window.__diapasonCorreo solo existe en las pruebas automáticas: recibe el enlace en vez de abrirlo)
function abrirMailto(url, ventana = false) {
  if (typeof window.__diapasonCorreo === 'function') return window.__diapasonCorreo(url);
  if (ventana) window.open(url, '_blank');
  else location.href = url;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

const safeName = (m) => {
  const base = (m.fileName || m.title || 'archivo').replace(/[\\/:*?"<>|]+/g, '-');
  return base.slice(0, 120);
};

/** Carga los adjuntos guardados en este dispositivo ({name, blob}); los que no estén se omiten */
async function loadFiles(materials) {
  const out = [];
  for (const m of materials) {
    try {
      const blob = await getFile(m.id);
      if (blob) out.push({ name: safeName(m), blob });
    } catch {
      /* el archivo no está en este dispositivo */
    }
  }
  return out;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre el correo del profesor con el mensaje preparado. Devuelve qué ha pasado, para avisar:
 * - 'android': Gmail/Outlook con todo relleno y los adjuntos.
 * - 'pc': correo abierto y carpeta con los adjuntos para arrastrarlos (Windows).
 * - 'share': menú Compartir con los adjuntos; el email del alumno queda copiado (iPhone/iPad).
 * - 'mailto': correo abierto (sin adjuntos, o descargados aparte en el navegador).
 */
export async function abrirCorreo(mail) {
  const files = await loadFiles(mail.files);
  const recipients = [...mail.to, ...mail.bcc];

  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const archivos = [];
    for (const f of files) {
      const w = await Filesystem.writeFile({ path: `correo/${f.name}`, data: await blobToBase64(f.blob), directory: Directory.Cache, recursive: true });
      archivos.push(w.uri);
    }
    await Correo.redactar({ para: mail.to, cco: mail.bcc, asunto: mail.subject, texto: mail.body, archivos });
    return { how: 'android', files: files.length };
  }

  if (isDesktop()) {
    if (files.length && window.diapasonPC?.prepararAdjuntos) {
      await window.diapasonPC.prepararAdjuntos(await Promise.all(files.map(async (f) => ({ nombre: f.name, datos: await f.blob.arrayBuffer() }))));
    }
    abrirMailto(mailtoUrl(mail), true);
    return { how: files.length ? 'pc' : 'mailto', files: files.length };
  }

  const mobile = ['iPhone', 'iPad', 'Android'].includes(deviceKind());
  if (files.length && mobile && navigator.canShare) {
    const shareFiles = files.map((f) => new File([f.blob], f.name, { type: f.blob.type || 'application/octet-stream' }));
    if (navigator.canShare({ files: shareFiles })) {
      const copied = recipients.length ? await copyText(recipients.join(', ')) : false;
      try {
        await navigator.share({ files: shareFiles, title: mail.subject, text: `${mail.subject}\n\n${mail.body}` });
      } catch {
        /* cancelado */
      }
      return { how: 'share', files: files.length, copied };
    }
  }

  // Navegador del PC (o sin poder compartir archivos): correo + adjuntos descargados
  for (const f of files) await deliverFile(f.blob, f.name);
  abrirMailto(mailtoUrl(mail));
  return { how: 'mailto', files: files.length };
}

/** Texto del aviso después de abrir el correo */
export function avisoCorreo(r, mail) {
  const faltan = mail.sinEmail.length ? ` · ${mail.sinEmail.length === 1 ? 'Falta el email de' : 'Faltan los emails de'} ${mail.sinEmail.map((p) => p.firstName).join(', ')}` : '';
  if (r.how === 'pc') return `Correo preparado. Arrastra ${r.files === 1 ? 'el adjunto' : 'los adjuntos'} de la carpeta que se ha abierto${faltan}`;
  if (r.how === 'share') return `${r.copied ? 'Email copiado: pégalo en «Para». ' : ''}Elige Mail o Gmail${faltan}`;
  if (r.how === 'mailto' && r.files) return `Correo preparado. Los adjuntos se han descargado: añádelos al correo${faltan}`;
  return `Correo preparado: revísalo y pulsa Enviar${faltan}`;
}
