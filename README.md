# JavaScript Sandbox

Really simple way to bind output of JS in some way to a sort of secure iFrame (sandboxed). We won't worry too much about securing the JS for now.

This is mainly used for the Decode website's tutorials, but feel free to get stuck in.

## Dependencies

CodeMirror for the editor, BonsaiJS for the output. The editor script will appropriately detect CodeMirror to import in module loader circumstances, but Bonsai must be available as a global for the output script to work (so only in the iFrame).
