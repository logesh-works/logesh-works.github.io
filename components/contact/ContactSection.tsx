import { ContactOption } from "@/props";

// icons
import { HiOutlineMail } from "react-icons/hi";
import { PiPhoneCallBold } from "react-icons/pi";
import { AiOutlineLinkedin, AiOutlineTwitter, AiOutlineWhatsApp } from "react-icons/ai";

const Social = () => {
  return (
    <section className="flex flex-wrap items-center justify-center gap-5">
      <ContactOption
        Icon={HiOutlineMail}
        title="Email"
        detail="logesh007kg@gmail.com"
        link="mailto:logesh007kg@gmail.com"
      />

      <ContactOption
        Icon={PiPhoneCallBold}
        title="Phone"
        detail="+91 8870310183"
        link="tel:+918870310183"
      />

      <ContactOption
        Icon={AiOutlineLinkedin}
        title="Linked In"
        detail="@logesh"
        link="https://www.linkedin.com/in/cl-me-logesh007/"
      />
    </section>
  );
};

export default Social;
