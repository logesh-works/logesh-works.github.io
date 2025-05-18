import { Achievements } from "@/components/achievements";

const AchievementsPage = () => {
  return (
    <div className="flex flex-col items-center py-14 gap-10 px-10 pb-24">
      <h1 className="text-4xl font-bold">Recent GitHub PushEvents

</h1>
      <p className="text-gray-400">On this page, you can view my recent GitHub pushes, highlighting my latest contributions to various projects</p>
      <Achievements />

     
    </div>
  );
};

export default AchievementsPage;
