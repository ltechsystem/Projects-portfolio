import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Github, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  technologies: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  legoColor?: string;
}

export function ProjectCard({
  title,
  description,
  technologies,
  videoUrl,
  thumbnailUrl,
  githubUrl,
  liveUrl,
  legoColor,
}: ProjectCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(err => {
        console.log("Video playback failed:", err);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 cursor-pointer group ${
        legoColor
          ? "rounded-3xl border-[3px] bg-white hover:-translate-x-1 hover:-translate-y-1"
          : "hover:shadow-lg"
      }`}
      style={
        legoColor
          ? { borderColor: legoColor, boxShadow: `6px 6px 0 ${legoColor}` }
          : undefined
      }
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/* Thumbnail */}
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`${title} thumbnail`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovering && videoUrl ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
        
        {/* Video overlay */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
            loop
            muted
            playsInline
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Links overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech, index) => (
            <Badge
              key={index}
              variant={legoColor ? "outline" : "secondary"}
              className={legoColor ? "border-2 font-semibold" : undefined}
              style={
                legoColor
                  ? { borderColor: legoColor, color: legoColor, backgroundColor: `${legoColor}1A` }
                  : undefined
              }
            >
              {tech}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
