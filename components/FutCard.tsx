import type { Player } from '../lib/types';

export function FutCard({ p, compact=false, detailHref, displayPosition, detailPosition = 'center' }: { p: Player; compact?: boolean; detailHref?: string; displayPosition?: string; detailPosition?: 'center'|'bottom-right' }){
  return (
    <article className={`fut-card ${compact ? 'fut-card--list' : ''}`}>
      <div className="fut-card__top">
        <div className="fut-card__rating">{p.rating}</div>
        <div className="fut-card__pos">{displayPosition || p.position}</div>
      </div>
      <div className="fut-card__media">
        <div className="fut-card__photo">
          <img
            src={p.photo || `/players/${p.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,'')}.webp`}
            alt={p.name}
            className="w-full h-full object-cover rounded-xl"
            draggable={false}
          />
        </div>
        {detailHref && (
          <a
            href={detailHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le joueur"
            draggable={false}
            onMouseDown={(e)=> e.stopPropagation()}
            className={`fut-card__detail ${detailPosition==='bottom-right' ? 'fut-card__detail--br' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </a>
        )}
      </div>
      <div className="fut-card__name">{p.name}</div>
      {!compact && null}
    </article>
  )
}

