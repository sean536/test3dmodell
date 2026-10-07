import './style.css';
import { intro } from './intro.js';

const menu = document.querySelector('#menu');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'SCHLIESSEN −' : 'MENÜ +';
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  menu.textContent = 'MENÜ +';
  navigation.classList.remove('open');
}));
document.querySelectorAll('.project-categories button').forEach((button, index) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.project-categories button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const name = document.querySelector('#project-name');
    name.textContent = button.textContent;
    name.classList.toggle('long-name', button.textContent === 'Sonderkonstruktionen');
    if (button.textContent === 'Sonderkonstruktionen') name.replaceChildren(document.createTextNode('Sonder'), document.createElement('wbr'), document.createTextNode('konstruktionen'));
    document.querySelector('#project-index').textContent = String(index + 1).padStart(2, '0');
    document.querySelector('.project-visual').setAttribute('aria-label', `Bildplatzhalter für ${button.textContent}`);
  });
});
const dialog = document.querySelector('#inquiry');
const inquire = document.querySelector('#inquire');
let inquiryOrigin = inquire;
inquire.addEventListener('click', () => { inquiryOrigin = inquire; dialog.showModal(); });
document.querySelector('#hero-inquire').addEventListener('click', event => { inquiryOrigin = event.currentTarget; dialog.showModal(); });
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => inquiryOrigin.focus());
document.querySelector('#inquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const text = `PROJEKTANFRAGE\n\nProjekt:\n${data.get('project')}\n\nKontakt:\n${data.get('email')}\n\nEntwurf — nicht versendet. FORMWERK ist ein fiktives Designkonzept.\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'projektanfrage.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#download-status').textContent = 'Die Textdatei wurde zum Download bereitgestellt. Ihre Anfrage wurde nicht versendet.';
});
import('./scene.js').then(({ initScene }) => initScene()).catch(() => {
  document.querySelector('#model-state').textContent = 'Die 3D-Ansicht ist nicht verfügbar. Alle Inhalte bleiben zugänglich.';
  intro.reveal({ instant: true });
});
