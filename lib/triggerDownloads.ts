/**
 * Triggers download of 5 empty (blank) files, one after another.
 * Purely a fun "prank" effect for the About section — files contain
 * no real data, just harmless placeholder text.
 */
export function triggerFiveDownloads() {
  const fileNames = [
    "system_access.log",
    "root_shell.sh",
    "database_dump.sql",
    "password_list.txt",
    "backdoor.exe.txt",
  ];

  fileNames.forEach((name, i) => {
    setTimeout(() => {
      const blob = new Blob([""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, i * 250);
  });
}
