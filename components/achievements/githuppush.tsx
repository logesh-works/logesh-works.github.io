// lib/getGitHubActivity.ts
export interface GitHubActivity {
    url: string;
    rname: string;
    desc: string;
    daysago: number;
  }
  
  const getGitHubActivity = async (username: string): Promise<GitHubActivity[]> => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/events`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const activityData = await response.json();
  
      const activities: GitHubActivity[] = [];
      const displayedRepos = new Set<string>(); // To track displayed repositories
  
      for (const activity of activityData) {
        if (activity.type === "PushEvent" && !displayedRepos.has(activity.repo.name)) {
          const repoName = activity.repo.name;
          const description = "@logesh-works"; // You can adjust this as needed
          const daysAgo = daysAgoFromDate(activity.created_at);
          const repoUrl = `https://github.com/${activity.repo.name}`;
          const activityCard = createGitHubActivityCard(repoName, description, daysAgo, repoUrl);
  
          activities.push(activityCard);
          displayedRepos.add(activity.repo.name);
  
          // Limit to the last 6 activities
          if (activities.length >= 6) {
            break;
          }
        }
      }
  
      return activities; // Return the array of activity objects
    } catch (error) {
      console.error('Error fetching GitHub activity:', error);
      return []; // Return an empty array in case of an error
    }
  };
  
  const createGitHubActivityCard = (repoName: string, description: string, daysAgo: number, repoUrl: string): GitHubActivity => {
    return { url: repoUrl, rname: repoName, desc: description, daysago: daysAgo };
  };
  
  const daysAgoFromDate = (dateString: string): number => {
    const activityDate = new Date(dateString);
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - activityDate.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  };
  
  export default getGitHubActivity;
  