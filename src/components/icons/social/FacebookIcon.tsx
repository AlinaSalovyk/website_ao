import type { SVGProps } from "react";

interface SocialSvgProps extends SVGProps<SVGSVGElement> {
  iconColor?: string;
  borderColor?: string;
  iconSize?: string;
}

export const FacebookIcon = ({
  iconColor = "fill-pure-black",
  borderColor = "fill-layout-bg",
  iconSize = "size-8",
  className,
  ...props
}: SocialSvgProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${iconSize} ${className ?? ""}`.trim()}
    {...props}
  >
    <path
      d="M35.1279 24.0059H38V20H34.625C30.9742 20 28 22.9494 28 26.5693V29.9902H25V33.9961H28V44H32V33.9961H36.0322L36.999 29.9902H32V26.5693C32 25.1572 33.1603 24.0059 34.625 24.0059H35.1279Z"
      className={iconColor}
    />
    <mask id="path-2-inside-1_facebook" className="fill-pure-white">
      <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
    </mask>
    <path
      d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z"
      className={borderColor}
      mask="url(#path-2-inside-1_facebook)"
    />
  </svg>
);
