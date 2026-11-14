import type { CSSProperties } from 'react';
import type { Room } from '@/lib/content';

/** Title, motto and bullets shown beside a door. */
export default function DoorDetails({ room, visible, style, className = '' }: { room: Room; visible: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none min-w-0 transition-[opacity,translate] duration-500 ease-out ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'} ${className}`}
      style={style}
    >
      <h3 className="text-[clamp(22px,2.3vw,34px)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-fg">{room.title}</h3>
      <p className="mt-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-soft uppercase md:text-[11px]">{room.motto}</p>
      <ul className="mt-4 grid list-none gap-2 p-0">
        {room.points.map(p => (
          <li key={p} className="flex items-center gap-2.5 text-[13px] text-fg/85 md:text-sm">
            <span className="size-2.5 shrink-0 rounded-full border-2 border-fg/80" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
