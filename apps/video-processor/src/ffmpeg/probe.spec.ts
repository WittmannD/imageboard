import { describe, expect, it } from 'vitest';

import { parseProbe } from './probe.js';

describe('parseProbe', () => {
  it('reads the format and the first video and audio stream', () => {
    expect(
      parseProbe({
        format: {
          format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
          duration: '12.500000',
          size: '1048576',
          bit_rate: '671088',
        },
        streams: [
          {
            codec_type: 'video',
            codec_name: 'h264',
            width: 1920,
            height: 1080,
            avg_frame_rate: '30000/1001',
          },
          { codec_type: 'audio', codec_name: 'aac' },
        ],
      }),
    ).toEqual({
      format: 'mov,mp4,m4a,3gp,3g2,mj2',
      duration: 12.5,
      size: 1048576,
      bitRate: 671088,
      width: 1920,
      height: 1080,
      fps: 30000 / 1001,
      rotation: 0,
      videoCodec: 'h264',
      audioCodec: 'aac',
      hasVideo: true,
      hasAudio: true,
    });
  });

  it('swaps the dimensions of videos rotated sideways', () => {
    const metadata = parseProbe({
      streams: [
        {
          codec_type: 'video',
          width: 1920,
          height: 1080,
          side_data_list: [{ rotation: -90 }],
        },
      ],
    });

    expect(metadata).toMatchObject({
      width: 1080,
      height: 1920,
      rotation: 270,
    });
  });

  it('reads the legacy rotate tag', () => {
    const metadata = parseProbe({
      streams: [
        {
          codec_type: 'video',
          width: 640,
          height: 480,
          tags: { rotate: '90' },
        },
      ],
    });

    expect(metadata).toMatchObject({ width: 480, height: 640, rotation: 90 });
  });

  it('handles missing streams and values', () => {
    expect(
      parseProbe({ streams: [{ codec_type: 'audio', codec_name: 'mp3' }] }),
    ).toMatchObject({
      hasVideo: false,
      hasAudio: true,
      width: undefined,
      fps: undefined,
      duration: undefined,
    });
  });

  it('ignores an unknown frame rate', () => {
    expect(
      parseProbe({ streams: [{ codec_type: 'video', avg_frame_rate: '0/0' }] })
        .fps,
    ).toBeUndefined();
  });
});
