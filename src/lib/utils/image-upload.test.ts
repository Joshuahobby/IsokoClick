import { describe, it, expect } from 'vitest'
import {
  ACCEPTED_IMAGE_TYPES,
  extensionFor,
  isAcceptedImageType,
  sniffImageType,
} from './image-upload'

const bytes = (...values: number[]) => new Uint8Array(values)
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0))

describe('sniffImageType', () => {
  it('identifies a JPEG by its SOI marker', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe('image/jpeg')
  })

  it('identifies a PNG by its full 8-byte signature', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
  })

  it('identifies a WebP by the RIFF and WEBP markers around the size field', () => {
    expect(
      sniffImageType(bytes(...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WEBP')))
    ).toBe('image/webp')
  })

  // The bucket is public, so a file that claims to be an image but is not
  // would be served back from our own origin under that content type.
  it('rejects markup masquerading as an image', () => {
    expect(sniffImageType(bytes(...ascii('<svg xmlns=')))).toBeNull()
  })

  it('rejects a RIFF container that is not WebP', () => {
    expect(
      sniffImageType(bytes(...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WAVE')))
    ).toBeNull()
  })

  it('rejects a truncated PNG signature rather than guessing', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e))).toBeNull()
  })

  it('rejects empty input', () => {
    expect(sniffImageType(bytes())).toBeNull()
  })
})

describe('isAcceptedImageType', () => {
  it('accepts every declared type', () => {
    for (const type of ACCEPTED_IMAGE_TYPES) expect(isAcceptedImageType(type)).toBe(true)
  })

  it('rejects types outside the list', () => {
    expect(isAcceptedImageType('image/svg+xml')).toBe(false)
    expect(isAcceptedImageType('image/gif')).toBe(false)
  })
})

describe('extensionFor', () => {
  it('maps each accepted type to its stored extension', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/png')).toBe('png')
    expect(extensionFor('image/webp')).toBe('webp')
  })
})
