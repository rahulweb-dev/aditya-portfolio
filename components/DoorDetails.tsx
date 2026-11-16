import type { CSSProperties } from 'react';
import RoleIcon from './RoleIcon';
import type { Room } from '@/lib/content';

/** Beside a door (always on the night scene): the craft's symbol, its name, its line and what it covers. */
export default function DoorDetails({ room, visible, style, className = '' }: { room: Room; visible: boolean; style?: CSSProperties; className?: string }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none min-w-0 text-on-dark transition-[opacity,translate] duration-500 ease-out ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'} ${className}`}
      style={style}
    >
      <RoleIcon craft={room.key} tone="night" size={32} />
      <h3 className="mt-3 text-[clamp(24px,2.3vw,32px)] leading-[1.15] font-medium text-balance">{room.title}</h3>
      <p className="micro-caps mt-2 text-muted-on-dark">{room.motto}</p>
      <ul className="mt-4 grid list-none gap-2 p-0">
        {room.points.map(p => (
          <li key={p} className="flex items-center gap-2.5 text-[13px] leading-[22px] text-muted-on-dark">
            <span className="size-1.5 shrink-0 rounded-full bg-icon-on-dark" />
            {p}
          </li>
        ))}
      </ul>
      <p className="label-caps mt-4 text-icon-on-dark">Enter →</p>
    </div>
  );
}
