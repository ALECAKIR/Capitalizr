"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
// Dosya adının ilk harfini büyüt/küçült
function getToggledFileName(fileName) {
    if (!fileName) {
        return fileName;
    }
    const first = fileName[0];
    return first === first.toUpperCase()
        ? first.toLowerCase() + fileName.slice(1)
        : first.toUpperCase() + fileName.slice(1);
}
// Dosyayı yeniden adlandırma ve editörde açma
async function renameAndOpenFile(uri, newFileName) {
    const dir = path.dirname(uri.fsPath);
    const newUri = vscode.Uri.file(path.join(dir, newFileName));
    if (uri.fsPath === newUri.fsPath) {
        vscode.window.showInformationMessage('Herhangi bir değişiklik gerekmiyor.');
        return;
    }
    try {
        await vscode.workspace.fs.rename(uri, newUri, { overwrite: false });
        // Yeniden adlandırılan bir dosyaysa, editörde aç
        const stat = await vscode.workspace.fs.stat(newUri);
        if (stat.type === vscode.FileType.File) {
            const doc = await vscode.workspace.openTextDocument(newUri);
            await vscode.window.showTextDocument(doc, { preview: false });
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`Yeniden adlandırma başarısız oldu: ${err.message}`);
    }
}
function activate(context) {
    // 1. Komut: Aktif dosyanın adını değiştir (Command Palette)
    const toggleActiveCommand = vscode.commands.registerCommand('extension.toggleFirstLetterCaseOfActive', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Aktif bir metin editörü yok.');
            return;
        }
        let uri = editor.document.uri;
        // Eğer dosya kaydedilmemişse, "Farklı Kaydet" penceresini göster
        if (editor.document.isUntitled) {
            vscode.window.showInformationMessage('Lütfen önce dosyayı kaydedin.');
            const newUri = await vscode.commands.executeCommand('workbench.action.files.saveAs');
            if (!newUri) {
                return; // Kullanıcı kaydetmeyi iptal etti
            }
            uri = newUri;
        }
        else {
            // Kirli ise dosyayı kaydet
            if (editor.document.isDirty) {
                await editor.document.save();
            }
        }
        const fileName = path.basename(uri.fsPath);
        const newFileName = getToggledFileName(fileName);
        await renameAndOpenFile(uri, newFileName);
    });
    // 2. Komut: Sağ tık menüsünden dosya/klasör adını değiştir (Explorer)
    const toggleContextCommand = vscode.commands.registerCommand('extension.toggleFirstLetterCaseContext', async (uri) => {
        if (!uri || uri.scheme !== 'file') {
            vscode.window.showWarningMessage('Lütfen bir dosya veya klasör seçin.');
            return;
        }
        const fileName = path.basename(uri.fsPath);
        const newFileName = getToggledFileName(fileName);
        await renameAndOpenFile(uri, newFileName);
    });
    context.subscriptions.push(toggleActiveCommand, toggleContextCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map