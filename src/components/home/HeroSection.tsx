import { HeroSpotlight } from "./HeroSpotlight";

interface HeroSectionProps {
  onNavigate?: (route: string) => void;
}

export function HeroSection({ onNavigate = () => {} }: HeroSectionProps) {
  return <HeroSpotlight onNavigate={onNavigate} />;
}

export default HeroSection;
