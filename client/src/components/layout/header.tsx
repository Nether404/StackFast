import { Search, Command, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  return (
    <header className="bg-github-dark border-b border-github-border sticky top-0 z-30 h-14">
      <div className="flex items-center justify-between h-full px-4 lg:pl-20">
        {/* Left side - Search */}
        <div className="flex items-center flex-1 max-w-2xl">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-3 px-4 py-1.5 bg-github-surface hover:bg-github-border rounded-lg border border-github-border transition-colors flex-1 max-w-md group"
            data-testid="header-search-button"
          >
            <Search className="h-4 w-4 text-github-text-secondary" />
            <span className="text-sm text-github-text-secondary">Search tools, actions...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-github-border bg-github-dark px-1.5 text-[10px] font-medium text-github-text-secondary group-hover:border-neon-orange/30">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-github-surface"
            data-testid="header-notifications"
          >
            <Bell className="h-4 w-4 text-github-text-secondary" />
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-neon-orange border-0"
            >
              <span className="text-[10px]">3</span>
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full hover:bg-github-surface"
                data-testid="header-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-github-surface text-xs">U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-github-surface border-github-border" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-github-border" />
              <DropdownMenuItem className="hover:bg-github-dark" data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-github-dark" data-testid="menu-settings">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-github-dark" data-testid="menu-help">
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-github-border" />
              <DropdownMenuItem className="hover:bg-github-dark text-red-400" data-testid="menu-logout">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
