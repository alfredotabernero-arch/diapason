; Musicae: todas las apps se instalan juntas en C:\Program Files\Musicae\<app>,
; también al actualizar desde otra carpeta (la de usuario o Program Files\<app>).
; La instalación anterior se desinstala sola (electron-builder) y los datos del usuario no se tocan.
; Con /D=carpeta se puede seguir eligiendo otra.
!macro customInit
  ${StdUtils.GetParameter} $R0 "D" ""
  ${If} $R0 == ""
    StrCpy $INSTDIR "$PROGRAMFILES64\Musicae\${APP_FILENAME}"
  ${EndIf}
!macroend
