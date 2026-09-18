import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/tokens';

export type AppIconName =
  | 'return'
  | 'package'
  | 'lock'
  | 'hammer'
  | 'edit'
  | 'mapPin'
  | 'bell'
  | 'key'
  | 'phone'
  | 'mail'
  | 'chat'
  | 'chevron'
  | 'menu'
  | 'bag'
  | 'heart'
  | 'search'
  | 'trash';

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

/** Simple SVG icons — avoid Unicode glyphs that render blank on many Android fonts. */
export function AppIcon({ name, size = 20, color = colors.text }: Props) {
  const stroke = color;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const };

  switch (name) {
    case 'return':
      return (
        <Svg {...common}>
          <Path
            d="M9 14L4 9l5-5"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 20v-7a4 4 0 0 0-4-4H4"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'package':
      return (
        <Svg {...common}>
          <Path
            d="M16.5 9.4 7.55 4.24"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M3.29 7 12 12l8.71-5M12 22V12" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common}>
          <Rect x={5} y={11} width={14} height={10} rx={2} stroke={stroke} strokeWidth={2} />
          <Path
            d="M8 11V7a4 4 0 0 1 8 0v4"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'hammer':
      return (
        <Svg {...common}>
          <Path
            d="M14.5 4.5 19 9l-2 2-4.5-4.5z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="m11.5 7.5-7 7 3 3 7-7"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="m5 16 3 3" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...common}>
          <Path
            d="M12 20h9"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'mapPin':
      return (
        <Svg {...common}>
          <Path
            d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
            stroke={stroke}
            strokeWidth={2}
          />
          <Circle cx={12} cy={10} r={3} stroke={stroke} strokeWidth={2} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path
            d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={stroke} strokeWidth={2} />
        </Svg>
      );
    case 'key':
      return (
        <Svg {...common}>
          <Path
            d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...common}>
          <Rect x={7} y={2} width={10} height={20} rx={2} stroke={stroke} strokeWidth={2} />
          <Path d="M11 18h2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...common}>
          <Rect x={3} y={5} width={18} height={14} rx={2} stroke={stroke} strokeWidth={2} />
          <Path d="m3 7 9 6 9-6" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg {...common}>
          <Path
            d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l1.9-5.1A8.5 8.5 0 1 1 21 11.5Z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg {...common}>
          <Path
            d="m9 18 6-6-6-6"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'menu':
      return (
        <Svg {...common}>
          <Path d="M4 7h16" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M4 12h16" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M4 17h16" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'bag':
      return (
        <Svg {...common}>
          <Path
            d="M6 8h12l-1 13H7L6 8Z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M9 8V7a3 3 0 0 1 6 0v1"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path
            d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1Z"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx={11} cy={11} r={7} stroke={stroke} strokeWidth={2} />
          <Path d="m20 20-3.5-3.5" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg {...common}>
          <Path d="M9 4h6" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M4 7h16" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
          <Path
            d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
            stroke={stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <Path d="M10 11v6" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M14 11v6" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}
