Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

strDir = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
strLog = strDir & "\git_push_result.txt"

' Criar arquivo de log
Set objFile = objFSO.CreateTextFile(strLog, True)
objFile.WriteLine "=== NeuroPed Git Push - " & Now() & " ==="
objFile.Close

' Função para rodar comando e salvar output
Function RunCmd(cmd)
    Dim strCmd
    strCmd = "cmd /c cd /d """ & strDir & """ && " & cmd & " >> """ & strLog & """ 2>&1"
    objShell.Run strCmd, 0, True
End Function

' Configurar identidade
Call RunCmd("git config user.email ""jadsonfraga@hotmail.com""")
Call RunCmd("git config user.name ""Dr. Jadson Fraga""")

' Adicionar arquivos
Call RunCmd("git add -A")

' Status
Call RunCmd("echo === STATUS === >> """ & strLog & """")
Call RunCmd("git status --short")

' Diff staged
Call RunCmd("echo === STAGED === >> """ & strLog & """")
Call RunCmd("git diff --cached --name-only")

' Commit
Call RunCmd("git commit -m ""feat: add CI/CD pipeline for autonomous GitHub Pages deploy""")

' Log
Call RunCmd("echo === LOG === >> """ & strLog & """")
Call RunCmd("git log --oneline -3")

' Push
Call RunCmd("git push origin feat/auditoria-total-ui-backend-memoria")

' Notificar conclusão
MsgBox "Git Push concluido! Verifique git_push_result.txt para o resultado.", 64, "NeuroPed CI/CD"
