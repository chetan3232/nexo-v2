import toast from "react-hot-toast";

export class GitHubService {
  private static instance: GitHubService;
  private token: string | null = null;

  public static getInstance() {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("github_token", token);
  }

  async createRepoAndPush(name: string, files: Record<string, string>) {
    if (!this.token) {
      toast.error("GitHub token not found. Please login.");
      return;
    }

    try {
      toast.loading("Creating repository...", { id: "github" });

      // 1. Create Repo (Mocking API calls for demo, would use Octokit in real app)
      // const response = await fetch('https://api.github.com/user/repos', { ... });

      await new Promise((r) => setTimeout(r, 1500));
      toast.loading("Pushing initial commit...", { id: "github" });

      await new Promise((r) => setTimeout(r, 1500));
      toast.success(`Successfully pushed to github.com/user/${name}`, {
        id: "github",
      });

      return { url: `https://github.com/user/${name}` };
    } catch (error) {
      toast.error("GitHub integration failed.");
      throw error;
    }
  }
}
