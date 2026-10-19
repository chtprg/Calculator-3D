'use strict';
// Desenho: o papel, o traço de tinta e o Broto. Tudo feito à mão, em código.

// a folha de papel: ruído fino e fibras curtas, gerado uma vez (o mesmo papel do Pavio)
(function papel() {
  const el = document.getElementById('papel');
  if (!el) return;
  const c = document.createElement('canvas'); c.width = c.height = 280;
  const x = c.getContext('2d'), img = x.createImageData(280, 280);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 34;
    img.data[i] = v; img.data[i + 1] = v * 0.98; img.data[i + 2] = v * 0.94; img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  for (let i = 0; i < 700; i++) {
    const px = Math.random() * 280, py = Math.random() * 280, a = Math.random() * Math.PI, L = 3 + Math.random() * 9;
    x.strokeStyle = Math.random() < 0.5 ? 'rgba(255,250,235,0.18)' : 'rgba(40,30,30,0.14)';
    x.lineWidth = 0.6 + Math.random() * 0.6;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * L * 0.5 + Math.random() * 2, py + Math.sin(a) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L);
    x.stroke();
  }
  el.style.backgroundImage = `url(${c.toDataURL()})`;
})();

// O Broto: a sementinha que toma conta do caderno.
// humor: feliz (sobrou dinheiro) · apertado (ficou no vermelho) · dormindo (caderno vazio) · contente (no zero a zero)
let brotoN = 0;
function broto(humor = 'feliz', { tamanho = 96, rotulo = '' } = {}) {
  const n = ++brotoN, tinta = 'var(--tinta)';
  const olhos = humor === 'dormindo'
    ? `<path d="M35 59q5 4 10 0M55 59q5 4 10 0" fill="none" stroke="${tinta}" stroke-width="2.6" stroke-linecap="round"/>`
    : `<ellipse cx="40" cy="58" rx="4.3" ry="5.6" fill="${tinta}"/><ellipse cx="60" cy="58" rx="4.3" ry="5.6" fill="${tinta}"/>
       <circle cx="41.6" cy="56" r="1.6" fill="#fff"/><circle cx="61.6" cy="56" r="1.6" fill="#fff"/>`;
  const boca = {
    feliz: '<path d="M43 69q7 8 14 0" fill="#c24b4b" stroke="var(--tinta)" stroke-width="2.4" stroke-linejoin="round"/>',
    contente: '<path d="M45 70q5 3.5 10 0" fill="none" stroke="var(--tinta)" stroke-width="2.4" stroke-linecap="round"/>',
    apertado: '<path d="M44.5 73q5.5-4.5 11 0" fill="none" stroke="var(--tinta)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M34 49.5l8.5 2.5M66 49.5l-8.5 2.5" stroke="var(--tinta)" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M77 41q3.6 5.4 0 8.4q-3.6-3-0-8.4Z" fill="#8fc7f0" stroke="var(--tinta)" stroke-width="1.4"/>',
    dormindo: '<ellipse cx="50" cy="71" rx="2.6" ry="2" fill="var(--tinta)"/>' +
      '<text x="70" y="34" font-family="Caveat" font-weight="700" font-size="15" fill="var(--tinta2)">z</text>' +
      '<text x="79" y="24" font-family="Caveat" font-weight="700" font-size="11" fill="var(--tinta2)">z</text>',
  }[humor] || '';
  // sombra em hachura (lápis), do lado direito de baixo, presa dentro do corpo
  let hach = '';
  for (let i = 0; i < 9; i++) { const x0 = 52 + i * 4.2; hach += `M${x0} 92L${x0 + 24} 56`; }
  return `<svg class="broto broto-${humor}" viewBox="0 0 100 100" width="${tamanho}" height="${tamanho}" role="img" aria-label="${rotulo || 'Broto, ' + humor}">
    <defs><clipPath id="corpo${n}"><path d="M50 30C72 30 82 48 80 64C78 82 64 90 50 90C36 90 22 82 20 64C18 48 28 30 50 30Z"/></clipPath></defs>
    <ellipse cx="50" cy="93" rx="23" ry="3.6" fill="var(--sombra)"/>
    <g class="respira">
      <g class="mao-livre">
        <path d="M50 31C50 25 51 21 52.5 16.5" fill="none" stroke="${tinta}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M51.5 20.5C43 10 31 11.5 28.5 18C36.5 24.5 46 24.5 51.5 20.5Z" fill="#79c653" stroke="${tinta}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M52.5 17C58 6.5 72 6 75.5 12.5C68.5 20.5 58.5 20.5 52.5 17Z" fill="#8fd16a" stroke="${tinta}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M50 30C72 30 82 48 80 64C78 82 64 90 50 90C36 90 22 82 20 64C18 48 28 30 50 30Z" fill="#9ad874"/>
        <path d="${hach}" clip-path="url(#corpo${n})" stroke="#4f9a37" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>
        <path d="M50 30C72 30 82 48 80 64C78 82 64 90 50 90C36 90 22 82 20 64C18 48 28 30 50 30Z" fill="none" stroke="${tinta}" stroke-width="2.6"/>
      </g>
      <ellipse cx="32.5" cy="68" rx="5.2" ry="3.1" fill="#f29a9a" opacity=".75"/>
      <ellipse cx="67.5" cy="68" rx="5.2" ry="3.1" fill="#f29a9a" opacity=".75"/>
      ${olhos}${boca}
    </g>
  </svg>`;
}

// ícone de rabisco
const ic = (id, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

// o selo do banco: o logo de verdade dentro de um círculo de papel
function seloBanco(bancoId, tam = 'm') {
  const b = bancoPorId(bancoId);
  const dentro = b.semLogo ? `<span class="sigla">${(b.nome.match(/\b\w/g) || ['?']).slice(0, 2).join('')}</span>`
    : `<img src="logos/${b.id}.svg" alt="" loading="lazy" decoding="async">`;
  return `<span class="selo selo-${tam}" title="${b.nome}">${dentro}</span>`;
}
