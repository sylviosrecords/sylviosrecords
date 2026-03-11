import React from 'react';

// ── Formatação ─────────────────────────────────────────────────────────────────
export const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const disc = (o: number, c: number) => Math.round(((o - c) / o) * 100);

// ── Slug e extração de ID ML ───────────────────────────────────────────────────
export function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function extrairIdML(slug: string): string {
  const match = slug.match(/^(MLB\d+)/i);
  return match ? match[1] : slug;
}

// ── Renderização de markdown simples ──────────────────────────────────────────
// Suporta: ### h3, **bold**, *italic*, \n\n parágrafos
export function renderMarkdown(texto: string): React.ReactNode[] {
  return texto.split('\n\n').map((bloco, i) => {
    if (bloco.startsWith('### ')) {
      return React.createElement('h3', {
        key: i,
        className: 'font-bebas text-2xl text-white mt-8 mb-3'
      }, bloco.replace('### ', ''));
    }
    const html = bloco
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    return React.createElement('p', {
      key: i,
      className: 'text-zinc-400 leading-relaxed mb-4',
      dangerouslySetInnerHTML: { __html: html }
    });
  });
}
