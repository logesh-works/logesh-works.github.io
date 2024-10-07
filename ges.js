let activits = [];
async function getGitHubActivity(username) {

    try {
      const response = await fetch(`https://api.github.com/users/${username}/events`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  // Function to create a card for GitHub activity
  function createGitHubActivityCard(repoName, description, daysAgo, repoUrl) {
    const activityCard ={url:repoUrl,rname:repoName,desc:description,daysago:daysAgo} ;
    return activityCard;
  }

  // Function to calculate the number of days ago
  function daysAgoFromDate(dateString) {
    const activityDate = new Date(dateString);
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - activityDate.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return daysAgo;
  }

  // Function to add GitHub activity cards to the HTML page
  async function displayGitHubActivity(username) {

    const activityData = await getGitHubActivity(username);
   
    //const container = document.getElementById("githubActivitySection");
    const displayedRepos = new Set(); // To track displayed repositories
    let displayedCount = 0; // To limit the number of displayed updates to 5

    for (const activity of activityData) {
      if (activity.type === "PushEvent" && !displayedRepos.has(activity.repo.name)) {
        const repoName = activity.repo.name;
        const description = "@logesh-works";
        const daysAgo = daysAgoFromDate(activity.created_at);
        const repoUrl = `https://github.com/${activity.repo.name}`;
        const activityCard = createGitHubActivityCard(repoName, description, daysAgo, repoUrl);
        activits.push(activityCard)
        displayedRepos.add(activity.repo.name);
        displayedCount++;
     
        
      }
      console.log(activits)
    }
  }

  // Call the function to display the GitHub activity cards
  const githubUsername = "logesh-works";
  displayGitHubActivity(githubUsername);
  