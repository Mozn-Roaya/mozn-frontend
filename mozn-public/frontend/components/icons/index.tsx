import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

// Icons sourced from the Figma design (public/assests/icons). Hardcoded
// stroke="#54545C" in the source SVGs has been swapped to `currentColor` so
// the icon respects the consumer's `text-*` token (theme-aware out of the
// box). All Figma icons are 32×32; we render at the requested `size` (default
// 24) and rely on viewBox scaling.
const FIGMA_SVG = {
  viewBox: "0 0 32 32",
  fill: "none" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

// Local 24×24 icons that aren't in the Figma asset folder yet. Kept as a
// fallback so consumers don't break — replace with Figma versions when
// designers add them.
const baseIconProps = (size: IconProps["size"] = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function FigmaSvg({
  size = 24,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} {...FIGMA_SVG} {...props}>
      {children}
    </svg>
  );
}

export function CloudRainIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M5.33332 19.8653C4.34271 18.8532 3.59541 17.6289 3.14803 16.2852C2.70065 14.9415 2.56493 13.5136 2.75113 12.1097C2.93734 10.7058 3.44059 9.36265 4.22278 8.18203C5.00496 7.00141 6.04556 6.01427 7.26576 5.29539C8.48596 4.5765 9.85375 4.14472 11.2655 4.03276C12.6773 3.92079 14.0961 4.13157 15.4143 4.64913C16.7326 5.1667 17.9158 5.97747 18.8743 7.02004C19.8328 8.0626 20.5415 9.30963 20.9467 10.6667H23.3333C24.6207 10.6665 25.8739 11.0804 26.908 11.8472C27.942 12.6141 28.702 13.6931 29.0757 14.9251C29.4494 16.157 29.4169 17.4764 28.9831 18.6885C28.5493 19.9005 27.7372 20.9409 26.6667 21.656"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21.3333 18.6667V26.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.6667 18.6667V26.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21.3333V29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function WindIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M17.0666 26.1333C17.4047 26.3868 17.7981 26.5564 18.2145 26.628C18.6309 26.6997 19.0584 26.6713 19.4617 26.5453C19.8651 26.4194 20.2327 26.1993 20.5343 25.9034C20.8359 25.6075 21.0628 25.2441 21.1964 24.8433C21.3301 24.4424 21.3665 24.0155 21.3028 23.5978C21.2391 23.1801 21.077 22.7835 20.8299 22.4408C20.5829 22.098 20.2579 21.8188 19.8818 21.6263C19.5057 21.4337 19.0892 21.3333 18.6666 21.3333H2.66663"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.3333 10.6666C23.6742 10.2121 24.1257 9.85223 24.6448 9.62123C25.1639 9.39023 25.7334 9.29576 26.2993 9.34678C26.8652 9.39781 27.4087 9.59264 27.8781 9.91278C28.3475 10.2329 28.7273 10.6677 28.9814 11.1759C29.2355 11.6841 29.3555 12.2489 29.3299 12.8165C29.3044 13.3841 29.1342 13.9358 28.8355 14.4191C28.5367 14.9024 28.1194 15.3014 27.6232 15.5781C27.1269 15.8547 26.5681 16 26 16H2.66663"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.0666 5.86665C13.4047 5.61312 13.7981 5.44356 14.2145 5.37192C14.6309 5.30028 15.0584 5.32862 15.4617 5.45461C15.8651 5.5806 16.2327 5.80062 16.5343 6.09655C16.8359 6.39249 17.0628 6.75585 17.1964 7.15671C17.3301 7.55756 17.3665 7.98443 17.3028 8.40214C17.2391 8.81984 17.077 9.21643 16.8299 9.55921C16.5829 9.90199 16.2579 10.1812 15.8818 10.3737C15.5057 10.5662 15.0892 10.6666 14.6666 10.6666H2.66663"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function DropletIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M16 29.3333C18.4753 29.3333 20.8493 28.35 22.5997 26.5997C24.35 24.8493 25.3333 22.4754 25.3333 20C25.3333 17.3333 24 14.8 21.3333 12.6667C18.6667 10.5333 16.6667 7.33333 16 4C15.3333 7.33333 13.3333 10.5333 10.6667 12.6667C7.99999 14.8 6.66666 17.3333 6.66666 20C6.66666 22.4754 7.64999 24.8493 9.40033 26.5997C11.1507 28.35 13.5246 29.3333 16 29.3333Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function GaugeIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M16 18.6666L21.3333 13.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.45329 25.3333C3.28292 23.3064 2.66672 21.0071 2.66663 18.6666C2.66654 16.3261 3.28256 14.0267 4.45278 11.9997C5.62301 9.97272 7.30619 8.28947 9.33315 7.11918C11.3601 5.94888 13.6594 5.33276 16 5.33276C18.3405 5.33276 20.6398 5.94888 22.6668 7.11918C24.6937 8.28947 26.3769 9.97272 27.5471 11.9997C28.7174 14.0267 29.3334 16.3261 29.3333 18.6666C29.3332 21.0071 28.717 23.3064 27.5466 25.3333"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function CompassIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function PlusIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M6.66667 16H25.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6.66663V25.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function MinusIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M6.66666 16H25.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function MapPinIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M26.6667 13.3334C26.6667 19.9907 19.2813 26.924 16.8013 29.0654C16.5703 29.2391 16.2891 29.333 16 29.333C15.7109 29.333 15.4297 29.2391 15.1987 29.0654C12.7187 26.924 5.33333 19.9907 5.33333 13.3334C5.33333 10.5044 6.45713 7.79127 8.45752 5.79088C10.4579 3.79049 13.171 2.66669 16 2.66669C18.829 2.66669 21.5421 3.79049 23.5425 5.79088C25.5429 7.79127 26.6667 10.5044 26.6667 13.3334Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17.3333C18.2091 17.3333 20 15.5425 20 13.3333C20 11.1242 18.2091 9.33331 16 9.33331C13.7909 9.33331 12 11.1242 12 13.3333C12 15.5425 13.7909 17.3333 16 17.3333Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function LocateFixedIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M2.66669 16H6.66669" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.3333 16H29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2.66669V6.66669" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 25.3333V29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="9.33333" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </FigmaSvg>
  );
}

export function LayersIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M17.1067 2.90668C16.7592 2.74821 16.3818 2.6662 16 2.6662C15.6181 2.6662 15.2407 2.74821 14.8933 2.90668L3.46666 8.10667C3.23006 8.211 3.0289 8.38187 2.88768 8.59848C2.74645 8.81509 2.67126 9.06809 2.67126 9.32667C2.67126 9.58525 2.74645 9.83826 2.88768 10.0549C3.0289 10.2715 3.23006 10.4423 3.46666 10.5467L14.9067 15.76C15.2541 15.9185 15.6315 16.0005 16.0133 16.0005C16.3952 16.0005 16.7726 15.9185 17.12 15.76L28.56 10.56C28.7966 10.4557 28.9978 10.2848 29.139 10.0682C29.2802 9.85159 29.3554 9.59859 29.3554 9.34001C29.3554 9.08143 29.2802 8.82843 29.139 8.61182C28.9978 8.39521 28.7966 8.22433 28.56 8.12001L17.1067 2.90668Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.66669 16C2.66606 16.255 2.73858 16.5049 2.87565 16.7199C3.01272 16.935 3.20858 17.1062 3.44002 17.2133L14.9067 22.4267C15.2523 22.5832 15.6273 22.6641 16.0067 22.6641C16.3861 22.6641 16.7611 22.5832 17.1067 22.4267L28.5467 17.2267C28.7827 17.1206 28.9827 16.9481 29.1224 16.7303C29.2621 16.5125 29.3354 16.2587 29.3334 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.66669 22.6667C2.66606 22.9217 2.73858 23.1716 2.87565 23.3866C3.01272 23.6017 3.20858 23.7729 3.44002 23.88L14.9067 29.0934C15.2523 29.2498 15.6273 29.3308 16.0067 29.3308C16.3861 29.3308 16.7611 29.2498 17.1067 29.0934L28.5467 23.8934C28.7827 23.7873 28.9827 23.6148 29.1224 23.397C29.2621 23.1792 29.3354 22.9254 29.3334 22.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function XIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M24 8L8 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8L24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function CheckIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function DownloadIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

export function ShareIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

export function HeadsetIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M4 14.6666H8C8.70724 14.6666 9.38552 14.9476 9.88562 15.4477C10.3857 15.9478 10.6667 16.626 10.6667 17.3333V21.3333C10.6667 22.0405 10.3857 22.7188 9.88562 23.2189C9.38552 23.719 8.70724 24 8 24H6.66667C5.95942 24 5.28115 23.719 4.78105 23.2189C4.28095 22.7188 4 22.0405 4 21.3333V14.6666ZM4 14.6666C4 13.0908 4.31039 11.5303 4.91345 10.0744C5.5165 8.61852 6.40042 7.29565 7.51472 6.18134C8.62902 5.06704 9.95189 4.18313 11.4078 3.58007C12.8637 2.97702 14.4241 2.66663 16 2.66663C17.5759 2.66663 19.1363 2.97702 20.5922 3.58007C22.0481 4.18313 23.371 5.06704 24.4853 6.18134C25.5996 7.29565 26.4835 8.61852 27.0866 10.0744C27.6896 11.5303 28 13.0908 28 14.6666M28 14.6666V21.3333C28 22.0405 27.719 22.7188 27.219 23.2189C26.7189 23.719 26.0406 24 25.3333 24H24C23.2928 24 22.6145 23.719 22.1144 23.2189C21.6143 22.7188 21.3333 22.0405 21.3333 21.3333V17.3333C21.3333 16.626 21.6143 15.9478 22.1144 15.4477C22.6145 14.9476 23.2928 14.6666 24 14.6666H28Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 21.3334V24C28 25.4145 27.4381 26.7711 26.4379 27.7713C25.4377 28.7715 24.0812 29.3334 22.6667 29.3334H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function PhoneCallIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M17.3333 2.66663C20.5159 2.66663 23.5682 3.93091 25.8186 6.18134C28.0691 8.43178 29.3333 11.484 29.3333 14.6666"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.3333 8C19.1015 8 20.7971 8.70238 22.0474 9.95262C23.2976 11.2029 24 12.8986 24 14.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.4427 22.0906C18.718 22.2171 19.0283 22.246 19.3222 22.1725C19.6162 22.0991 19.8764 21.9277 20.06 21.6866L20.5333 21.0666C20.7817 20.7354 21.1038 20.4666 21.4741 20.2815C21.8444 20.0963 22.2527 20 22.6667 20H26.6667C27.3739 20 28.0522 20.2809 28.5523 20.781C29.0524 21.2811 29.3333 21.9594 29.3333 22.6666V26.6666C29.3333 27.3739 29.0524 28.0521 28.5523 28.5522C28.0522 29.0523 27.3739 29.3333 26.6667 29.3333C20.3015 29.3333 14.197 26.8047 9.69609 22.3039C5.19522 17.803 2.66666 11.6985 2.66666 5.33329C2.66666 4.62605 2.94761 3.94777 3.4477 3.44767C3.9478 2.94758 4.62608 2.66663 5.33332 2.66663H9.33332C10.0406 2.66663 10.7188 2.94758 11.2189 3.44767C11.719 3.94777 12 4.62605 12 5.33329V9.33329C12 9.74728 11.9036 10.1556 11.7185 10.5259C11.5333 10.8961 11.2645 11.2182 10.9333 11.4666L10.3093 11.9346C10.0645 12.1215 9.89202 12.3874 9.82104 12.6871C9.75007 12.9868 9.78503 13.3018 9.91999 13.5786C11.7422 17.2798 14.7392 20.273 18.4427 22.0906Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function SunIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M16 21.3334C18.9455 21.3334 21.3333 18.9455 21.3333 16C21.3333 13.0545 18.9455 10.6667 16 10.6667C13.0545 10.6667 10.6667 13.0545 10.6667 16C10.6667 18.9455 13.0545 21.3334 16 21.3334Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 2.66669V5.33335" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 26.6667V29.3334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.57333 6.5733L8.45333 8.4533" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.5467 23.5467L25.4267 25.4267" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.66667 16H5.33334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26.6667 16H29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.45333 23.5467L6.57333 25.4267" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.4267 6.5733L23.5467 8.4533" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function CloudSunIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path d="M16 2.66669V5.33335" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.57333 6.5733L8.45333 8.4533" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26.6667 16H29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25.4267 6.5733L23.5467 8.4533" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21.2627 16.8666C21.4268 15.8726 21.306 14.8525 20.9143 13.9243C20.5226 12.9961 19.876 12.1979 19.0494 11.622C18.2227 11.046 17.2499 10.716 16.2435 10.6701C15.2371 10.6243 14.2383 10.8644 13.3627 11.3627"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.3333 29.3333H9.33334C8.07197 29.3331 6.83655 28.975 5.77057 28.3006C4.70459 27.6263 3.8518 26.6633 3.31124 25.5237C2.77068 24.384 2.56454 23.1143 2.71675 21.8622C2.86897 20.61 3.37329 19.4267 4.17115 18.4498C4.96901 17.4728 6.02767 16.7422 7.22417 16.3429C8.42066 15.9436 9.7059 15.8919 10.9306 16.1938C12.1553 16.4958 13.2692 17.139 14.1429 18.0487C15.0167 18.9585 15.6144 20.0974 15.8667 21.3333H17.3333C18.3942 21.3333 19.4116 21.7548 20.1618 22.5049C20.9119 23.2551 21.3333 24.2725 21.3333 25.3333C21.3333 26.3942 20.9119 27.4116 20.1618 28.1618C19.4116 28.9119 18.3942 29.3333 17.3333 29.3333Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FigmaSvg>
  );
}

export function MoonIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export function GlobeIcon({ size, ...props }: IconProps) {
  return (
    <FigmaSvg size={size} {...props}>
      <path
        d="M16 29.3334C23.3638 29.3334 29.3333 23.3638 29.3333 16C29.3333 8.63622 23.3638 2.66669 16 2.66669C8.63619 2.66669 2.66666 8.63622 2.66666 16C2.66666 23.3638 8.63619 29.3334 16 29.3334Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 2.66669C12.5763 6.26156 10.6667 11.0357 10.6667 16C10.6667 20.9644 12.5763 25.7385 16 29.3334C19.4237 25.7385 21.3333 20.9644 21.3333 16C21.3333 11.0357 19.4237 6.26156 16 2.66669Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2.66666 16H29.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </FigmaSvg>
  );
}

export function ChevronDownIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AlertTriangleIcon({ size, ...props }: IconProps) {
  return (
    <svg {...baseIconProps(size)} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
