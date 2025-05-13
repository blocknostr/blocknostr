
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AboutTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About BlockNostr</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>BN</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">BlockNostr</h3>
              <p className="text-sm text-muted-foreground">
                A decentralized social media client for Nostr
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm">
              BlockNostr is a client for the Nostr protocol, a decentralized
              social media protocol that enables censorship-resistant communication.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Version</h4>
            <p className="text-sm text-muted-foreground">1.0.0</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium">Learn More</h4>
            <ul className="text-sm space-y-1 mt-1">
              <li>
                <a 
                  href="https://github.com/nostr-protocol/nostr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Nostr Protocol
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/nostr-protocol/nips"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Nostr Improvement Proposals (NIPs)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutTab;
