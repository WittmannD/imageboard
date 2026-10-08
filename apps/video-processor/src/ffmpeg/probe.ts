// The subset of `ffprobe -show_format -show_streams` output that is read
export interface ProbeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  tags?: Record<string, string>;
  side_data_list?: { rotation?: number }[];
}

export interface ProbeResult {
  streams?: ProbeStream[];
  format?: {
    format_name?: string;
    duration?: string;
    size?: string;
    bit_rate?: string;
  };
}

export interface VideoMetadata {
  // ffprobe's demuxer name, e.g. "mov,mp4,m4a,3gp,3g2,mj2"
  format?: string;
  // Seconds
  duration?: number;
  size?: number;
  bitRate?: number;
  // Display dimensions, i.e. with the rotation applied, as ffmpeg outputs them
  width?: number;
  height?: number;
  fps?: number;
  rotation: number;
  videoCodec?: string;
  audioCodec?: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

// "30000/1001" → 29.97
function parseFrameRate(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const [numerator, denominator = '1'] = value.split('/');
  const fps = Number(numerator) / Number(denominator);
  return Number.isFinite(fps) && fps > 0 ? fps : undefined;
}

function getRotation(stream: ProbeStream): number {
  const sideDataRotation = stream.side_data_list?.find(
    (data) => data.rotation !== undefined,
  )?.rotation;
  const rotation = sideDataRotation ?? toNumber(stream.tags?.['rotate']) ?? 0;

  // normalize to 0, 90, 180 or 270
  return (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;
}

export function parseProbe(probe: ProbeResult): VideoMetadata {
  const streams = probe.streams ?? [];
  const video = streams.find((stream) => stream.codec_type === 'video');
  const audio = streams.find((stream) => stream.codec_type === 'audio');
  const rotation = video ? getRotation(video) : 0;
  const isSideways = rotation === 90 || rotation === 270;

  return {
    format: probe.format?.format_name,
    duration: toNumber(probe.format?.duration),
    size: toNumber(probe.format?.size),
    bitRate: toNumber(probe.format?.bit_rate),
    width: isSideways ? video?.height : video?.width,
    height: isSideways ? video?.width : video?.height,
    fps: parseFrameRate(video?.avg_frame_rate),
    rotation,
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
    hasVideo: video !== undefined,
    hasAudio: audio !== undefined,
  };
}
