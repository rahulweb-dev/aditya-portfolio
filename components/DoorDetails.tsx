import type { CSSProperties } from 'react';
import RoleIcon from './RoleIcon';
import type { Room } from '@/lib/content';

/** Beside a door (phones): the craft's symbol, its name, its line and what it covers. Follows the site's mode. */
export default function DoorDetails({ room, visible, style, className = '' }: { room: Room; visible: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none min-w-0 text-fg transition-[opacity,translate] duration-500 ease-out ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'} ${className}`}
      style={style}
    >
      <RoleIcon craft={room.key} size={32} />
      <h3 className="mt-3 text-[clamp(24px,2.3vw,32px)] leading-[1.15] font-medium text-balance">{room.title}</h3>
      <p className="micro-caps mt-2 text-soft">{room.motto}</p>
      <ul className="mt-4 grid list-none gap-2 p-0">
        {room.points.map(p => (
          <li key={p} className="flex items-start gap-2.5 text-[13px] leading-[22px] text-soft">
            <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-rec" />
            {p}
          </li>
        ))}
      </ul>
      <p className="label-caps mt-4 text-fg">Enter →</p>
    </div>
  );
}
