import { FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { HiOutlineMail } from "react-icons/hi";
import { PiPhoneBold } from "react-icons/pi";

import type { SocialLink } from "@/interfaces";

const icons = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  instagram: FaInstagram,
  mail: HiOutlineMail,
  phone: PiPhoneBold,
} as const;

const SocialIcon = ({ icon, className }: { icon: SocialLink["icon"]; className?: string }) => {
  const Icon = icons[icon];
  return <Icon aria-hidden className={className} />;
};

export default SocialIcon;
