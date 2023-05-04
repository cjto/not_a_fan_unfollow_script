const fetchOptions = {
  credentials: "include",
  headers: {
    "X-IG-App-ID": "936619743392459",
  },
  method: "GET",
};

let username;

window.resolveInstaScriptPermissions = () => {};

async function executeWithNotice(fn, ...args) {
  if (window.location.origin !== "https://www.instagram.com") {
    window.alert(
      "Hey! You need to be on the instagram site before you run the code. I'm taking you there now but you're going to have to run the code into the console again."
    );
    window.location.href = "https://www.instagram.com";
    console.clear();
    return;
  }

  const permission = new Promise(resolve => (window.resolveInstaScriptPermissions  = resolve));

  const WARNING = `
--- IMPORTANT PLEASE READ ---\n\n
Hey! \n
No worries, everything is fine. Before starting, let me explain how this works and share some advice.\n
First, never blindly paste code into the console unless you understand it.\n
Although this code isn't malicious, the developer console is risky unless you're confident in your abilities.\n
Pasting code you don't comprehend is like giving your phone to a stranger.\n
Anything you can do on Instagram's website or app can be done through code in the developer console. Be very cautious!\n\n
How this script works:\n
(APIs allow your browser to communicate with Instagram's servers)\n
1. We use the Instagram search API with your username to obtain your User ID, which identifies your account on Instagram.\n
2. We call the 'following' API endpoint with your user ID.\n
This mimics scrolling through your own Instagram following list, with pauses between requests to avoid looking like a bot.\n
3. We repeat this process for the 'followers' API endpoint, creating lists of your followers and followings.\n
4. We compare the lists, displaying the difference as 'People who don't follow you back' and vice versa.\n\n
Now that you know how it works, do you want to continue? (If not, close this tab.)\n`;

  // Sorry I know this is ugly I didn't want to make the file too long
  document.write(`<pre style='white-space: pre-wrap;word-wrap: break-word;'>${WARNING}</pre>
  <br />
  <button style='cursor:pointer;padding: 1rem;box-shadow: 4px 5px 1px #b0b0b0;font-size: 18px;background: #00b894; color: white;border-radius: 10px;' onClick="window.resolveInstaScriptPermissions()">OK I understand and want to continue</button>`);

  await permission;


  document.write("<br/><p color='green;font-weight: bolder;'>Ok, thanks. Look back at the console to see the output. Refreshing this tab will also make everything go back to normal.</p>")
  return await fn(...args);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const random = (min, max) => Math.ceil(Math.random() * (max - min)) + min;

// This function handles all of the pagination logic
// Calls the API recursively until there are no more pages to load
const concatFriendshipsApiResponse = async (
  list,
  user_id,
  count,
  next_max_id = ""
) => {
  let url = `https://www.instagram.com/api/v1/friendships/${user_id}/${list}/?count=${count}`;
  if (next_max_id) {
    url += `&max_id=${next_max_id}`;
  }

  const data = await fetch(url, fetchOptions).then((r) => r.json());

  if (data.next_max_id) {
    const timeToSleep = random(100, 500);
    console.log(
      `Loaded ${data.users.length} ${list}. Sleeping ${timeToSleep}ms to avoid rate limiting`
    );

    await sleep(timeToSleep);

    return data.users.concat(
      await concatFriendshipsApiResponse(list, user_id, count, data.next_max_id)
    );
  }

  return data.users;
};

// helper methods to make the code a bit more readable
const getFollowers = (user_id, count = 50, next_max_id = "") => {
  return concatFriendshipsApiResponse("followers", user_id, count, next_max_id);
};

const getFollowing = (user_id, count = 50, next_max_id = "") => {
  return concatFriendshipsApiResponse("following", user_id, count, next_max_id);
};

const getUserId = async (username) => {
  let user = username;

  const lower = user.toLowerCase();
  const url = `https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=${lower}&include_reel=false`;
  const data = await fetch(url, fetchOptions).then((r) => r.json());

  const result = data.users?.find(
    (result) => result.user.username.toLowerCase() === lower
  );

  return result?.user?.pk || null;
};

const getUserFriendshipStats = async (username) => {
  if (username === "example_username") {
    username = window.prompt(
      "Hey, it looks like you forgot to change the username variable. No worries, we'll update it right now. What's your username?"
    );
  }

  const user_id = await getUserId(username);

  if (!user_id) {
    throw new Error(`Could not find user with username ${username}`);
  }

  const followers = await getFollowers(user_id);
  const following = await getFollowing(user_id);

  const followersUsernames = followers.map((follower) =>
    follower.username.toLowerCase()
  );
  const followingUsernames = following.map((followed) =>
    followed.username.toLowerCase()
  );

  const followerSet = new Set(followersUsernames);
  const followingSet = new Set(followingUsernames);

  console.log(Array(28).fill("-").join(""));
  console.log(
    `Fetched`,
    followerSet.size,
    "followers and ",
    followingSet.size,
    " following."
  );

  console.log(
    `If this doesn't seem right then some of the output might be inaccurate`
  );

  const PeopleIDontFollowBack = Array.from(followerSet).filter(
    (follower) => !followingSet.has(follower)
  );

  const PeopleNotFollowingMeBack = Array.from(followingSet).filter(
    (following) => !followerSet.has(following)
  );

  return {
    PeopleIDontFollowBack,
    PeopleNotFollowingMeBack,
  };
};

// Make sure you don't delete the quotes
// Replace "example_username" below with your instagram username
//
// Change this:
username = "example_username";
//
//
//
executeWithNotice(getUserFriendshipStats, username).then(console.log);
