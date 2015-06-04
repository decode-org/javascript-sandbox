var sandbox = new Sandbox(document.querySelector('section.code-container'), document.getElementById('output-frame'));
var recoder = new Recode.Recoder();

sandbox.bindRecoder(recoder);
