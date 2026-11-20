export default function Logo({ size = 180 }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 200 120" role="img" aria-label="Third eye protection">
      <defs>
        <mask id="eyemask">
          <rect width="200" height="120" fill="#000" />
          <path d="M8 70 Q100 -8 192 70 Q100 148 8 70Z" fill="#fff" />
          <circle cx="100" cy="70" r="46" fill="#000" />
        </mask>
      </defs>
      <rect width="200" height="120" fill="#fff" mask="url(#eyemask)" />
      <circle cx="160" cy="22" r="9" fill="#e41c3a" />
    </svg>
  );
}
