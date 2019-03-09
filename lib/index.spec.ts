import execa from 'execa'
import { FetchClientFormatter } from './formatters'
import { GenerateTypings, GenerateTypingsOptions } from './index'
import { OpenAPIObject } from './typings/openapi'

describe('GenerateTypings', () => {
  describe('given an empty openapi schema', () => {
    const schema: OpenAPIObject = {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Some API',
      },
      components: {
        schemas: {},
      },
      paths: {},
    }
    itShouldGenerateValidTypingsFromSchema(schema)
    it('should respond nothing', async () => {
      const generated = await GenerateTypings(schema)
      expect(generated).toMatch(/^\s*$/)
      expect(generated).toEqual('')
    })
  })

  describe('given the Petstore schema', () => {
    const schema = require('../fixtures/petstore.json')
    itShouldGenerateValidTypingsFromSchema(schema)
    it('should output types for components.schemas', async () => {
      const generated = await GenerateTypings(schema)
      expect(generated).toContain('export interface Pet')
      expect(generated).toContain('export type Pets = (Pet)[]')
    })
  })

  describe('given the Petstore Expanded schema', () => {
    const schema = require('../fixtures/petstoreExpanded.json')
    itShouldGenerateValidTypingsFromSchema(schema)
    it('should output types for components.schemas', async () => {
      const generated = await GenerateTypings(schema)
      expect(generated).toContain('export type Pet = NewPet & {')
      expect(generated).toContain('NewPet ')
    })
    it('should output types for paths', async () => {
      const generated = await GenerateTypings(schema)
      expect(generated).toContain('FindPetByIdRequest')
      expect(generated).toContain('FindPetByIdResult') 
      expect(generated).toContain('export type FindPetByIdResult = Pet;\n')
      expect(generated).toContain('FindPetByIdFallback')
      expect(generated).toContain('export type FindPetByIdFallback = Error;\n')
    })

    describe('FetchClientFormatter', () => {
      const options = {
        operationFormatters: [new FetchClientFormatter()],
      }
      itShouldGenerateValidTypingsFromSchema(schema, options)

      it('should generate client actions', async () => {
        const generated = await GenerateTypings(schema, options)
        expect(generated).toContain('method: "post"')
      })
    })
  })
})

function itShouldGenerateValidTypingsFromSchema(schema: any, options?: GenerateTypingsOptions) {
  it('should match generated snapshot', async () => {
    expect((await GenerateTypings(schema, options))).toMatchSnapshot()
  })

  it('does not contain $magic$', async () => {
    expect(await GenerateTypings(schema, options)).not.toContain('$magic$')
  })

  it('should evaluate', async () => {
    const generated = await GenerateTypings(schema, options)
    if (/\S+/.test(generated)) await execa.stdout('ts-node', ['--eval', generated])
  })
}
