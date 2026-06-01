const SUPABASE_URL = "https://yxbgslmuksamvxguwfuo.supabase.co"
const SUPABASE_KEY = "sb_publishable_kGKNTkbZAG3z0NkqZ6NJhg__urSIRGU"

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedSongs =
 JSON.parse(localStorage.getItem("selectedSongs")) || [];

let allSongs = [];

function normalizeArtist(name) {
 return name.replace(/^the\s+/i, "").toLowerCase();
}

function sortSongs(data, column) {

 return [...data].sort((a, b) => {

  if (column === "artist") {
   return normalizeArtist(a.artist).localeCompare(
    normalizeArtist(b.artist)
   );
  }

  return String(a[column]).toLowerCase().localeCompare(
   String(b[column]).toLowerCase()
  );

 });
}

function renderSongs(data) {

 const container = document.getElementById("song-list");

 if (!container) return;

 container.innerHTML = "";

 data.forEach(song => {

  const isSelected =
   selectedSongs.some(s => s.id === song.id);

  const div = document.createElement("div");

  div.className =
   "song" + (isSelected ? " selected" : "");

  div.onclick = () =>
   toggleSong(song.id, song.movie);

  div.innerHTML = `
   <span>${isSelected ? "&#9989" : ""}</span>

   <img src="${song.movie_cover}" width="60">

   <div>
    ${song.title}<br>
    <strong>${song.artist}</strong><br>
    <em>${song.movie}</em>
   </div>
  `;

  container.appendChild(div);

 });

 updateNextButton();
}

function updateNextButton() {
	
	console.log("Selected:", selectedSongs.length);

 const buttons =
  document.querySelectorAll(".next-step-btn");

 buttons.forEach(btn => {
  btn.disabled = selectedSongs.length < 10;
 });
}

function toggleSong(id, movie) {

 const index =
  selectedSongs.findIndex(s => s.id === id);

 if (index > -1) {
  selectedSongs.splice(index, 1);
 } else {
  selectedSongs.push({ id, movie });
 }

 localStorage.setItem(
  "selectedSongs",
  JSON.stringify(selectedSongs)
 );

 renderSongs(sortSongs(allSongs, "artist"));
}

async function loadSongs(sortColumn = "artist") {

 const { data, error } =
  await client.from("songs").select("*");

 if (error) {
  console.error(error);
  return;
 }

 allSongs = data;

 const sorted = sortSongs(data, sortColumn);

 renderSongs(sorted);
}

function goToRanking() {

 if (selectedSongs.length < 10) {
  alert("Select at least 10 songs.");
  return;
 }

 localStorage.setItem(
  "selectedSongs",
  JSON.stringify(selectedSongs)
 );

 window.location.href = "rank.html";
}



async function loadSelectedSongs() {

 const stored =
  JSON.parse(localStorage.getItem("selectedSongs")) || [];

 if (stored.length === 0) {
  const container = document.getElementById("song-list");
  if (container) container.innerHTML = "No songs selected.";
  return;
 }

 const songIds = stored.map(s => s.id);

 const { data, error } = await client
  .from("songs")
  .select("*")
  .in("id", songIds);

 if (error) {
  console.error(error);
  return;
 }

 const ordered = songIds.map(id =>
  data.find(song => song.id === id)
 );

 rankSongs(ordered);
}


function updateRanks() {

 const songs = document.querySelectorAll("#song-list .song");

 songs.forEach((song, index) => {

  const rankEl = song.querySelector(".rank");

  const rank = 10 - index;

  if (rankEl) {
   rankEl.textContent = rank > 0 ? rank : "-";
  }

 });
}






function rankSongs(data) {

 const container = document.getElementById("song-list");
 if (!container) return;

 container.innerHTML = "";

 data.forEach(song => {

  const div = document.createElement("div");
  div.className = "song";
  div.dataset.id = song.id;

  div.innerHTML = `
   <span class="rank"></span>
   <img src="${song.movie_cover}" width="60">
   <div>
    ${song.title}<br>
    <strong>${song.artist}</strong><br>
    <em>${song.movie}</em>
   </div>
  `;

  container.appendChild(div);
 });

 new Sortable(container, {
  animation: 150,
  draggable: ".song",
  onEnd: updateRanks
 });

 updateRanks();
}

function clearSongs() {

 selectedSongs = [];

 localStorage.removeItem("selectedSongs");

 renderSongs(sortSongs(allSongs, "artist"));

}

async function submitVote() {

 const name =
  document.getElementById("voter-name").value.trim();

 if (!name) {
  alert("Please enter your name.");
  return;
 }

 const voteType =
  document.querySelector('input[name="vote-type"]:checked');

 if (!voteType) {
  alert("Please select if you are a member of a subreddit.");
  return;
 }

 const songs =
  [...document.querySelectorAll("#song-list .song")];

 const rankedSongs = songs.map((song, index) => {

 const title =
  song.querySelector("div").childNodes[0].textContent.trim();

 const artist =
  song.querySelector("strong").textContent;

 const movie =
  song.querySelector("em").textContent;

 return {
  rank: index + 1,
  title,
  artist,
  movie
 };

});

 const submission = {
  name: name,
  vote_type: voteType.value,
  submitted_at: new Date().toISOString(),
  rankings: rankedSongs
 };

 console.log("Vote submitted:");
 console.log(submission);

 alert(
  "Vote captured.\n\nCheck the browser console (F12)."
 );
}