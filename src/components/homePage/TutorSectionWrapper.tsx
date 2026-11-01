import { getAllTutors } from "@/services/teachers";
import { IUser } from "@/types/user";
import TutorSection from "./TutorSection";

const TutorSectionWrapper = async () => {
  const tutorData = await getAllTutors();
  const tutors: IUser[] = tutorData?.data || [];
  const topTutors = tutors.slice(0, 6);

  return <TutorSection tutors={topTutors} />;
};

export default TutorSectionWrapper;
