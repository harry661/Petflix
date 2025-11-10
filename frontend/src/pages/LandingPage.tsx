import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">Petflix</h1>
          <p className="text-xl text-muted-foreground">
            Discover, share, and engage with pet videos from YouTube
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="rounded-full"
            onClick={() => navigate('/search')}
          >
            Search for Pet Videos
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-full"
            onClick={() => navigate('/login')}
          >
            Create Account / Sign In
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Discover</CardTitle>
              <CardDescription>
                Find amazing pet videos from YouTube
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search through thousands of pet videos and discover new favorites.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
              <CardDescription>
                Share your favorite pet videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Share YouTube videos with the Petflix community and build your following.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engage</CardTitle>
              <CardDescription>
                Connect with pet lovers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Follow other users, comment on videos, and curate playlists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

