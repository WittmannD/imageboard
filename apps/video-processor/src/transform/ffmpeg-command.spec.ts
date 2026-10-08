import { describe, expect, it } from 'vitest';

import { FfmpegCommand } from './ffmpeg-command.js';
import type { OperationContext } from './operation/operation-context.js';
import {
  type OperationArgsMap,
  operationMap,
} from './operation/operation-map.js';

const context = {} as OperationContext;

function apply<K extends keyof OperationArgsMap>(
  command: FfmpegCommand,
  operation: K,
  args: OperationArgsMap[K],
) {
  void operationMap[operation].process(command, args, context);
  return command;
}

function argsOf(command: FfmpegCommand) {
  return command.toArgs('in.mp4', 'out.mp4');
}

function optionValue(args: string[], option: string) {
  const index = args.indexOf(option);
  return index === -1 ? undefined : args[index + 1];
}

describe('FfmpegCommand', () => {
  it('maps the first video and audio stream by default', () => {
    const args = argsOf(new FfmpegCommand());

    expect(args).toEqual(
      expect.arrayContaining(['-i', 'in.mp4', '-map', '0:v:0', '0:a:0?']),
    );
    expect(args.at(-1)).toBe('out.mp4');
  });

  it('puts seeking before the input', () => {
    const args = argsOf(
      apply(new FfmpegCommand(), 'trim', { start: 1, duration: 2 }),
    );

    expect(args.indexOf('-ss')).toBeLessThan(args.indexOf('-i'));
    expect(optionValue(args, '-ss')).toBe('1');
    expect(optionValue(args, '-t')).toBe('2');
  });

  it('chains video filters in operation order', () => {
    const command = new FfmpegCommand();
    apply(command, 'crop', { width: 100, height: 50, x: 10, y: 20 });
    apply(command, 'fps', { fps: 15 });

    expect(optionValue(argsOf(command), '-vf')).toBe(
      'crop=100:50:10:20,fps=15',
    );
  });

  it('drops the audio when muted', () => {
    const command = new FfmpegCommand();
    apply(command, 'h264', {});
    apply(command, 'mute', {});
    const args = argsOf(command);

    expect(args).toContain('-an');
    expect(args).not.toContain('0:a:0?');
    expect(args).not.toContain('-c:a');
  });

  it('does not leak changes of a clone into the original', () => {
    const original = new FfmpegCommand();
    apply(original, 'h264', {});
    const clone = original.clone();
    apply(clone, 'scale', { width: 100 });
    apply(clone, 'trim', { start: 1 });
    clone.encoder?.videoOptions.push('-extra');

    expect(original.videoFilters).toEqual([]);
    expect(original.start).toBeUndefined();
    expect(original.encoder?.videoOptions).not.toContain('-extra');
  });

  it('rejects non-numeric filter values', () => {
    expect(() =>
      apply(new FfmpegCommand(), 'scale', {
        width: '1:x,movie=/etc/passwd' as unknown as number,
      }),
    ).toThrow('width must be a finite number');
  });
});

describe('operations', () => {
  describe('trim', () => {
    it('is relative to an earlier trim', () => {
      const command = new FfmpegCommand();
      apply(command, 'trim', { start: 2, duration: 10 });
      apply(command, 'trim', { start: 3, end: 5 });

      expect(command.start).toBe(5);
      expect(command.duration).toBe(2);
    });

    it('keeps within an earlier trim', () => {
      const command = new FfmpegCommand();
      apply(command, 'trim', { duration: 4 });
      apply(command, 'trim', { start: 1, duration: 10 });

      expect(command.start).toBe(1);
      expect(command.duration).toBe(3);
    });

    it('rejects an empty range', () => {
      expect(() =>
        apply(new FfmpegCommand(), 'trim', { start: 5, end: 5 }),
      ).toThrow(RangeError);
    });
  });

  describe('scale', () => {
    const filtersOf = (args: OperationArgsMap['scale']) =>
      apply(new FfmpegCommand(), 'scale', args).videoFilters;

    it('fits inside the box by default', () => {
      expect(filtersOf({ width: 1280, height: 720 })).toEqual([
        'scale=w=1280:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2',
        'setsar=1',
      ]);
    });

    it('keeps the aspect ratio with a single dimension', () => {
      expect(filtersOf({ height: 360 })[0]).toBe('scale=w=-2:h=360');
    });

    it('does not enlarge when asked not to', () => {
      expect(filtersOf({ width: 640, withoutEnlargement: true })[0]).toBe(
        "scale=w='min(640,iw)':h=-2",
      );
    });

    it('crops to cover the box', () => {
      expect(filtersOf({ width: 200, height: 200, fit: 'cover' })).toEqual([
        'scale=w=200:h=200:force_original_aspect_ratio=increase',
        'crop=200:200',
        'setsar=1',
      ]);
    });

    it('stretches to fill the box', () => {
      expect(filtersOf({ width: 200, height: 100, fit: 'fill' })[0]).toBe(
        'scale=w=200:h=100',
      );
    });

    it('letterboxes to exactly the box with contain', () => {
      expect(filtersOf({ width: 200, height: 100, fit: 'contain' })).toEqual([
        'scale=w=200:h=100:force_original_aspect_ratio=decrease:force_divisible_by=2',
        'pad=200:100:(ow-iw)/2:(oh-ih)/2',
        'setsar=1',
      ]);
    });

    it('rounds sizes down to even ones', () => {
      expect(filtersOf({ width: 241, height: 393, fit: 'cover' })).toEqual([
        'scale=w=240:h=392:force_original_aspect_ratio=increase',
        'crop=240:392',
        'setsar=1',
      ]);
      expect(filtersOf({ width: 1 })[0]).toBe('scale=w=2:h=-2');
    });

    it('needs a dimension', () => {
      expect(() => filtersOf({})).toThrow(TypeError);
    });
  });

  describe('frame', () => {
    it('seeks relative to the trimmed start and renders one image', () => {
      const command = new FfmpegCommand();
      apply(command, 'trim', { start: 2, duration: 3 });
      apply(command, 'frame', { time: 1, format: 'png' });
      const args = argsOf(command);

      expect(command.start).toBe(3);
      expect(command.duration).toBeUndefined();
      expect(args).toEqual(
        expect.arrayContaining(['-frames:v', '1', '-c:v', 'png']),
      );
      expect(optionValue(args, '-f')).toBe('image2');
      expect(args).not.toContain('0:a:0?');
    });

    it('maps jpeg quality to the mjpeg scale', () => {
      const best = argsOf(
        apply(new FfmpegCommand(), 'frame', { quality: 100 }),
      );
      const worst = argsOf(apply(new FfmpegCommand(), 'frame', { quality: 1 }));

      expect(optionValue(best, '-q:v')).toBe('2');
      expect(optionValue(worst, '-q:v')).toBe('31');
    });
  });

  describe('encoders', () => {
    it('encodes h264 into a faststart mp4', () => {
      const args = argsOf(
        apply(new FfmpegCommand(), 'h264', { crf: 20, preset: 'fast' }),
      );

      expect(optionValue(args, '-c:v')).toBe('libx264');
      expect(optionValue(args, '-crf')).toBe('20');
      expect(optionValue(args, '-preset')).toBe('fast');
      expect(optionValue(args, '-movflags')).toBe('+faststart');
      expect(optionValue(args, '-f')).toBe('mp4');
    });

    it('lets the last encoder win', () => {
      const command = new FfmpegCommand();
      apply(command, 'h264', {});
      apply(command, 'vp9', {});
      const args = argsOf(command);

      expect(optionValue(args, '-c:v')).toBe('libvpx-vp9');
      expect(optionValue(args, '-c:a')).toBe('libopus');
      expect(optionValue(args, '-f')).toBe('webm');
      expect(args).not.toContain('libx264');
    });
  });
});
