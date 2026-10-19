import type { Board, ShapeObject, WhiteboardObject } from '../shared/types';

export function escapeXml(value: string): string { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character); }

function shapePath(object: ShapeObject): string {
  const { width: w, height: h } = object;
  switch (object.shape) {
    case 'ellipse': return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${Math.abs(w / 2)}" ry="${Math.abs(h / 2)}" />`;
    case 'triangle': return `<path d="M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z" />`;
    case 'diamond': return `<path d="M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z" />`;
    case 'hexagon': return `<path d="M ${w * .25} 0 L ${w * .75} 0 L ${w} ${h / 2} L ${w * .75} ${h} L ${w * .25} ${h} L 0 ${h / 2} Z" />`;
    case 'star': { const points = Array.from({ length: 10 }, (_, index) => { const angle = -Math.PI / 2 + index * Math.PI / 5; const radius = index % 2 === 0 ? Math.min(w, h) / 2 : Math.min(w, h) / 4; return `${w / 2 + Math.cos(angle) * radius},${h / 2 + Math.sin(angle) * radius}`; }).join(' '); return `<polygon points="${points}" />`; }
    case 'cloud': return `<path d="M 12 ${h * .7} C 0 ${h * .7}, 0 ${h * .35}, ${w * .2} ${h * .35} C ${w * .25} ${h * .08}, ${w * .62} ${h * .06}, ${w * .7} ${h * .32} C ${w} ${h * .24}, ${w} ${h * .7}, ${w * .82} ${h * .7} Z" />`;
    default: return `<rect width="${w}" height="${h}" rx="${object.shape === 'rounded-rectangle' ? 14 : 0}" />`;
  }
}

function objectToSvg(object: WhiteboardObject): string {
  const transform = `translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})`;
  const style = `fill:${object.style.fill};stroke:${object.style.stroke};stroke-width:${object.style.strokeWidth};opacity:${object.style.opacity};stroke-linejoin:round;stroke-linecap:round`;
  switch (object.type) {
    case 'shape': return `<g transform="${transform}" style="${style}">${shapePath(object)}</g>`;
    case 'stroke': return `<polyline points="${object.points.map((point) => `${point.x} ${point.y}`).join(' ')}" fill="none" stroke="${object.style.stroke}" stroke-width="${object.style.strokeWidth}" opacity="${object.style.opacity}" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'line': return `<polyline points="${object.points.map((point) => `${point.x} ${point.y}`).join(' ')}" fill="none" style="${style}" />`;
    case 'connector': return `<polyline points="${object.waypoints.map((point) => `${point.x} ${point.y}`).join(' ')}" fill="none" style="${style}" marker-end="${object.arrowEnd ? 'url(#arrow)' : ''}" />`;
    case 'text': return `<text x="${object.x}" y="${object.y + object.fontSize}" fill="${object.style.stroke}" font-family="${escapeXml(object.fontFamily)}" font-size="${object.fontSize}" font-weight="${object.bold ? '700' : '400'}" font-style="${object.italic ? 'italic' : 'normal'}">${escapeXml(object.text)}</text>`;
    case 'sticky': return `<g transform="${transform}"><rect width="${object.width}" height="${object.height}" rx="8" fill="${object.color}" stroke="#c28f24" /><foreignObject x="12" y="12" width="${Math.max(1, object.width - 24)}" height="${Math.max(1, object.height - 24)}"><div xmlns="http://www.w3.org/1999/xhtml" style="font: ${object.fontSize}px sans-serif; white-space: pre-wrap;">${escapeXml(object.text)}</div></foreignObject></g>`;
    case 'mindmap-node': return `<g transform="${transform}"><rect width="${object.width}" height="${object.height}" rx="14" style="${style}" /><text x="${object.width / 2}" y="${object.height / 2 + 6}" text-anchor="middle" fill="${object.style.stroke}" font-family="Inter, sans-serif" font-size="16">${escapeXml(object.text)}</text></g>`;
    case 'frame': return `<g transform="${transform}"><rect width="${object.width}" height="${object.height}" fill="none" stroke="#8b5cf6" stroke-dasharray="8 6" /><text x="8" y="-8" fill="#7c3aed" font-size="16">${escapeXml(object.name)}</text></g>`;
    case 'image': return `<image href="${escapeXml(object.src)}" x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" preserveAspectRatio="xMidYMid meet" />`;
  }
}

export function boardToSvg(board: Board, width = 1600, height = 900): string {
  const background = board.background.type === 'transparent' ? 'none' : board.background.color;
  const pattern = board.background.type === 'grid' || board.background.type === 'dots' ? `<pattern id="grid" width="${board.background.gridSize}" height="${board.background.gridSize}" patternUnits="userSpaceOnUse"><path d="M ${board.background.gridSize} 0 L 0 0 0 ${board.background.gridSize}" fill="none" stroke="${board.background.gridColor}" stroke-width="1" opacity=".7" />${board.background.type === 'dots' ? `<circle cx="${board.background.gridSize / 2}" cy="${board.background.gridSize / 2}" r="1.3" fill="${board.background.gridColor}" />` : ''}</pattern>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${pattern}<marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#1f2937" /></marker></defs><rect width="100%" height="100%" fill="${background}" />${pattern ? `<rect width="100%" height="100%" fill="url(#grid)" />` : ''}<g transform="translate(${width / 2} ${height / 2})">${board.objects.filter((object) => object.visible).sort((a, b) => a.zIndex - b.zIndex).map(objectToSvg).join('')}</g></svg>`;
}
