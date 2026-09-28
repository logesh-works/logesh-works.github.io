export interface GitHubActivity {
  url: string;
  repo: string;
  daysAgo: number;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
}

const daysAgoFromDate = (date: string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

/** Latest distinct repositories the user pushed to (max 6). Returns [] on any failure. */
const getGitHubActivity = async (username: string): Promise<GitHubActivity[]> => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events`);
    if (!response.ok) return [];
    const events: GitHubEvent[] = await response.json();

    const seen = new Set<string>();
    const activities: GitHubActivity[] = [];
    for (const event of events) {
      if (event.type !== "PushEvent" || seen.has(event.repo.name)) continue;
      seen.add(event.repo.name);
      activities.push({
        url: `https://github.com/${event.repo.name}`,
        repo: event.repo.name,
        daysAgo: daysAgoFromDate(event.created_at),
      });
      if (activities.length >= 6) break;
    }
    return activities;
  } catch {
    return [];
  }
};

export default getGitHubActivity;
