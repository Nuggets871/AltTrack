export interface LottieIconConfig {
  iconName: string;
  width: number;
  height: number;
  loop: boolean;
  autoplay: boolean;
}

export const DEFAULT_LOTTIE_CONFIG: Partial<LottieIconConfig> = {
  width: 24,
  height: 24,
  loop: false,
  autoplay: false
};

