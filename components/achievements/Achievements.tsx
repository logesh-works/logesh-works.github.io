"use client"; // Mark this file as a Client Component

import { useEffect, useState } from 'react';
import { Achievement } from "@/props";
import getGitHubActivity, { GitHubActivity } from "./githuppush";
import { Link } from 'lucide-react';

const Achievements = () => {
  const [activities, setActivities] = useState<GitHubActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const username = 'logesh-works'; // Replace with your GitHub username
      try {
        const data: GitHubActivity[] = await getGitHubActivity(username);
        console.log(data); // Print the activity data to the console
        setActivities(data); // Store the fetched activities in state
      } catch (err) {
        setError('Failed to fetch activities');
        console.error(err); // Log the error to the console
      } finally {
        setLoading(false);
      }
    })(); // Immediately invoke the function
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading activities: {error}</p>;

  return (
    <section className="flex flex-wrap gap-10 justify-center">
      {activities.map((activity, index) => (
        <a href={activity.url} key={index} >
          <Achievement
          key={index} // Use a unique key if possible
          logo="/logos/repo.png" // Adjust this based on your activity data
          title={activity.rname} // Adjust this to match your activity structure
          description={activity.desc || "No description provided."} // Adjust based on your activity structure
          date={activity.daysago}
        />
        </a>
      ))}

    </section>
  );
};

export default Achievements;
