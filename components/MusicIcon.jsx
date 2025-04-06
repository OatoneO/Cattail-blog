export default function MusicIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 25" {...props}>
      <rect x="2.5" y="10" width="2.5" height="5" className="fill-current">
        <animate
          attributeName="height"
          values="5;15;5"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y"
          values="10;5;10"
          dur="1s"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="7.5" y="7.5" width="2.5" height="10" className="fill-current">
        <animate
          attributeName="height"
          values="10;20;10"
          dur="1s"
          repeatCount="indefinite"
          begin="0.2s"
        />
        <animate
          attributeName="y"
          values="7.5;2.5;7.5"
          dur="1s"
          repeatCount="indefinite"
          begin="0.2s"
        />
      </rect>
      <rect x="12.5" y="5" width="2.5" height="15" className="fill-current">
        <animate
          attributeName="height"
          values="15;25;15"
          dur="1s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="y"
          values="5;0;5"
          dur="1s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </rect>
      <rect x="17.5" y="7.5" width="2.5" height="10" className="fill-current">
        <animate
          attributeName="height"
          values="10;20;10"
          dur="1s"
          repeatCount="indefinite"
          begin="0.6s"
        />
        <animate
          attributeName="y"
          values="7.5;2.5;7.5"
          dur="1s"
          repeatCount="indefinite"
          begin="0.6s"
        />
      </rect>
      <rect x="22.5" y="10" width="2.5" height="5" className="fill-current">
        <animate
          attributeName="height"
          values="5;15;5"
          dur="1s"
          repeatCount="indefinite"
          begin="0.8s"
        />
        <animate
          attributeName="y"
          values="10;5;10"
          dur="1s"
          repeatCount="indefinite"
          begin="0.8s"
        />
      </rect>
    </svg>
  );
}
