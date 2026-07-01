export function decodeWavBuffer(buffer: Buffer): { samples: Float32Array; sampleRate: number } {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF') {
    throw new Error('Audio recording could not be read.')
  }

  let offset = 12
  let sampleRate = 44100
  let channelCount = 1
  let bitsPerSample = 16
  let dataOffset = -1
  let dataSize = 0

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4)
    const chunkSize = buffer.readUInt32LE(offset + 4)
    const chunkStart = offset + 8

    if (chunkId === 'fmt ') {
      const audioFormat = buffer.readUInt16LE(chunkStart)
      channelCount = buffer.readUInt16LE(chunkStart + 2)
      sampleRate = buffer.readUInt32LE(chunkStart + 4)
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14)

      if (audioFormat !== 1) {
        throw new Error('Audio recording could not be read.')
      }
    } else if (chunkId === 'data') {
      dataOffset = chunkStart
      dataSize = chunkSize
      break
    }

    offset = chunkStart + chunkSize + (chunkSize % 2)
  }

  if (dataOffset === -1 || bitsPerSample !== 16) {
    throw new Error('Audio recording could not be read.')
  }

  const frameCount = Math.floor(dataSize / (channelCount * (bitsPerSample / 8)))
  const samples = new Float32Array(frameCount)

  for (let i = 0; i < frameCount; i++) {
    let mixed = 0
    for (let channel = 0; channel < channelCount; channel++) {
      const sampleOffset = dataOffset + (i * channelCount + channel) * 2
      mixed += buffer.readInt16LE(sampleOffset) / 0x8000
    }
    samples[i] = mixed / channelCount
  }

  return { samples, sampleRate }
}

export function decodeWavBase64(base64: string): { samples: Float32Array; sampleRate: number } {
  return decodeWavBuffer(Buffer.from(base64, 'base64'))
}
