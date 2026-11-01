import Banner from "@/components/homePage/Banner";
import BenefitsSection from "@/components/homePage/BenefitsSection";
import FbPageSection from "@/components/homePage/FbPageSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "ইসলামী দাওয়াহ ইনস্টিটিউট, তুষভান্ডার । Islami Dawah Institute, Tushbahander",
  description: "",
};

export default function HomePage() {
  return (
    <div className="">
      <Banner />
      <BenefitsSection />
      <FbPageSection />
      {/* <FounderSection /> */}
      {/* <ActionBanner/>
      <Partnerships/> */}
    </div>
  );
}
