# Petflix Development - Prompt History

This document records all prompts and instructions given during the development of Petflix.

## Initial Setup & Project Structure

### Initial Request
- "Lets start a new project and set up everything so this is ready to be built. Petflix is a responsive web application, enhanced by PWA functionality, designed to provide users with a dedicated platform to discover, share, and engage with pet videos sourced from YouTube..."
- User requested step-by-step approach with tagging when input is needed
- Emphasis on adhering to PRD, staying in scope, prioritizing functional correctness over visual design
- Requested setting up Supabase and Vercel accounts using pixelbeard email
- Requested using Cursor's plan mode and maintaining structured GitHub workflow

### Infrastructure Setup
- User provided Supabase anon public key
- User provided Supabase service role key
- User provided YouTube API key: `AIzaSyCeaZYVAT19fC0BJA8ed6F8xuX0Bji4oa8`

## Authentication & Login Flow

### Initial Issues
- "lets test authentication first"
- "it says safari cant connect to server"
- "is the backend running? i still cant connect"
- "lets make the skeleton of the frontend just sp we can test the backend properly"
- "I still cant reach this. just do everything you need to"
- "frontend"
- "i cant see anything on the express backend apart from this text"
- "question dont do anything. So unlike a filament backend I cant see anything visually in the backend with express?"

### UI Development
- "Ok great its now working. Lets start adding the UI. Understand that i would like to provide designs further down the line to improve this visually. I just want to make sure this works functinaloty wise"
- "No im still seeing this page. This test page isnt necessary and should I should start with onboardng. Look at the scope and build out all feature groups"

### Registration Issues
- "Looking good. But ive just tred to create an accoutn and its returning 'load failed'"
- "start it for me"
- "its now saying failed to check user existance"
- "Still the same issue. Make sore all the infastructure is inplace to allow for all the functionality in the scope/PRD/FEATURE GROUPS"
- "ive put the key in there"
- "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYW5icmdmb3ZidnpvYXNqeXVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NTc0NywiZXhwIjoyMDc4MzYxNzQ3fQ.-nL2Cvnm4VQp8JUhP3Ets9m4uENeIyVcXJ9gPluzg8w"

### Login Flow Issues
- "I created an account and when i login nothing is here. I am still able to login when i should now be seeng an account menu. Look at the feature groups and scope. This isnt correct"
- "Why is the settings navbar tab a login screen?"
- "Load failed again. Make sure all the flows are working as intending from the scope/feature groups. Dont make me ask yet again"
- "logging in doesnt do anything"
- "Ive added a youtube api key"
- "AIzaSyCeaZYVAT19fC0BJA8ed6F8xuX0Bji4oa8 use this youtube api key"
- "lets redo the login flow. I want the landing page to be a login/signup form that will then take me through to the home page"

## Landing Page & Login Structure

### Login Form Requirements
- "The login structure is incorrect. It should be:
  - Title
  - Email address
  - Password
  - Sign in
  - Forgot password
  - Remember me
  - Sign up if i dont have an account cta"

### Navigation Changes
- "Good. We don't need a top banner on the page. Remove this and the sign in at the top right."
- "I still want the Petflix logo at the top left but visible"

### Logo & Branding
- "Lets not use emojis. Lets use shadcn icons."
- "I also cant see the petflix logo lets make it blue"
- "No you have removed the petflix logo now and gone off scope."
- "The blue should be the same blue as in the scope obviously, remember to stick to the scop and PRD."
- "I want the petflix logo and text at top left to be the same colour"
- "The logo is still black. Make this ADD8E6"
- "Whatever you jsut did broke everything. The page is now blank. If something seems difficult consult me first before acting. You are wasting efforts. Remember this"
- "@Paw.svg Use this as our logo"

## Navigation Bar Redesign

### Netflix-Style Navigation
- "Lets change the top navbar."
- "I want the structure to be similar to this image."
- "Logo - Home - Poplular - Favourites - [space] - search icon - notification bell icon - my profile(Profile picture with account menu dropdown)"
- "Good. I am happy with the navbar for now."

## Home Page Content

### Content Cleanup
- "Lets start on the home page content."
- "We dont need those 3 cards(Search, your feed, profile)"
- "Lets also remove the old logo from the welcome message"
- "Good."

## GitHub Repository

### Repository Setup
- "Good. Looks like we don't have a Github."
- "Can we create one so we can push changes etc"
- "Is this it? https://github.com/harry661/Petflix.git"
- "Great."
- "No I would like you create a text document that records all of the prompts and I giving you"

## Key Principles & Guidelines

### Development Approach
- Stay within scope and PRD
- Prioritize functional correctness over visual design initially
- Use step-by-step approach
- Tag user when input is needed
- Consult user before making difficult changes
- Don't waste efforts on complex solutions without consultation

### Color Scheme (from PRD/Scope)
- Primary Blue: `#ADD8E6` (Light Blue)
- Background: `#F0F0DC` (Cream)
- Foreground: `#36454F` (Charcoal)

### Technical Stack
- Frontend: React 19, TypeScript, Vite, Shadcn UI, Lucide React icons
- Backend: Express 5, TypeScript, Node.js
- Database: Supabase (PostgreSQL)
- API: YouTube Data API v3
- Authentication: JWT tokens

## Current Status

- ✅ Project structure set up (monorepo: frontend/backend)
- ✅ Database schema created in Supabase
- ✅ Authentication flow working (login/register)
- ✅ Navigation bar redesigned (Netflix-style)
- ✅ Landing page with login/signup form
- ✅ Home page with trending videos
- ✅ GitHub repository connected
- ✅ Paw.svg logo integrated
- ✅ All feature groups from PRD implemented (onboarding, search, video sharing, social features, playlists, profiles)

## UI/UX Improvements & Bug Fixes (November 2025)

### Search Page & Dropdown Styling
- "Now on the search page the relevance dropdown doesnt look nice, lets change this to match our styling. There is a similar issue on the report modal"
- "The report modal now doesnt appear and i get a black screen"
- "On teh searched for page lets have a similar layout to every other page(5 videos a row at appropriate screen size)"

### Playlist Features
- "We need an added to playlist success screen similar to the repost one"
- "Can we add better playlist card elements to the profile page? This would provide a better preview of the content"

### Home Page Content
- "Trending pet videos currently doesnt fill the 2 rows of content. This should show currently popular videos on the platform"

### Profile Picture Upload Issues
- "Good, also profile picture link uploads doesnt seem to funciton correclty. SmallFurry's profile photo appears as a quesiton mark"
- "https://unsplash.com/s/photos/hamster I just tried using this URL to add a proilfe photo to smallfurry but this isnt being picked up once added"
- "https://plus.unsplash.com/premium_photo-1723541849330-cab9c6ed74d4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aGFtc3RlcnxlbnwwfHwwfHx8MA%3D%3D I tried to sue this image address but this still isnt wokring. Im getting this error"
- "https://supertails.com/cdn/shop/articles/360_f_681163919_71bp2aiyziip3l4j5mbphdxtipdtm2zh_e2c1dbbd-e3b0-4c7d-bc09-1ebff39513ef.jpg?v=1747293323 I also tried this one which also doesnt work"
- "https://images.unsplash.com/photo-1721327900409-2393c686bc48?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhhbXN0ZXJ8ZW58MHx8MHx8fDA%3D Im trying to upload https images but they wont appear. iM SEEING A QUESTON MARK"
- "Whenever i try to upload a new image it defaults back to this image link"
- "The add image layout seems slightly broken after addng guidance text"
- "give me a working image link for a hamster"
- "I cant remove or replace the text in the image upload field. I remove all teh characters then this comes back endlessly"

### Testing & Deployment
- "start the backend"
- "Looks liek we didnt finish your last task"
- "start the local backend"
- "deploy our progress please"
- "Push and deploy our changes"
- "@Browser Test my Petflix app at https://petflix-weld.vercel.app/ - create 2 accounts, test all major features, verify notifications work between accounts, and report any console errors or issues"
- "Add this and then continue your testing"
- "Lets fix those issues and errors"
- "Great. Now push our changes and deploy. Have you 100% tested end to end?"
- "Update the prompt hstory document with every single prompt ive given you. Then continue testing until 100% complete."

## Notes

- User prefers to provide designs later for visual improvements
- Focus is on functionality first
- User wants to be consulted before complex changes
- All infrastructure should be in place for full PRD scope
- User emphasizes thorough testing and fixing all issues before deployment

