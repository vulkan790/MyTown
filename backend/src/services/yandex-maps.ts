import { FastifyInstance } from 'fastify';

import ky from 'ky';
import { ok, err, type Result, fromPromise } from 'neverthrow';
import { randomUUID } from 'node:crypto';

interface TextItem {
  text: string;
}

interface Distance {
  value: number;
  text: string;
}

interface ResultItem {
  title: TextItem;
  subtitle?: TextItem;
  tags: string[];
  distance: Distance;
  uri: string;
}

interface SuggestApiResponse {
  suggest_reqid: string;
  results: ResultItem[];
}

interface GeocoderResponseMetaData {
  request: string;
  found: string;
  results: string;
}

interface AddressComponent {
  kind: string;
  name: string;
}

interface PostalCode {
  PostalCodeNumber: string;
}

interface Premise {
  PremiseNumber: string;
  PostalCode: PostalCode;
}

interface Thoroughfare {
  ThoroughfareName: string;
  Premise: Premise;
}

interface Locality {
  LocalityName: string;
  Thoroughfare: Thoroughfare;
}

interface AdministrativeArea {
  AdministrativeAreaName: string;
  Locality: Locality;
}

interface CountryAddress {
  AddressLine: string;
  CountryNameCode: string;
  CountryName: string;
  AdministrativeArea: AdministrativeArea;
}

interface Address {
  country_code: string;
  postal_code: string;
  formatted: string;
  Components: AddressComponent[];
}

interface AddressDetails {
  Country: CountryAddress;
}

interface GeocoderMetaData {
  kind: string;
  text: string;
  precision: string;
  Address: Address;
  AddressDetails: AddressDetails;
}

interface Envelope {
  lowerCorner: string;
  upperCorner: string;
}

interface Point {
  pos: string;
}

interface GeoObject {
  metaDataProperty: {
    GeocoderMetaData: GeocoderMetaData;
  };
  description: string;
  name: string;
  boundedBy: {
    Envelope: Envelope;
  };
  Point: Point;
}

interface FeatureMember {
  GeoObject: GeoObject;
}

interface GeoObjectCollection {
  metaDataProperty: {
    GeocoderResponseMetaData: GeocoderResponseMetaData;
  };
  featureMember: FeatureMember[];
}

interface GeocoderApiResponse {
  response: {
    GeoObjectCollection: GeoObjectCollection;
  };
}

type SuggestItem = {
  title: string;
  subtitle: string;
  uri: string;
};

type SuggestResult = Result<SuggestItem[], unknown>;

type GeocodeResult = Result<{
  latitude: number;
  longitude: number;
}, unknown>;

export const registerYandexMaps = async (fastify: FastifyInstance) => {
  const suggestApiKey = fastify.config.YANDEX_SUGGEST_API_KEY;
  const geocoderApiKey = fastify.config.YANDEX_GEOCODER_API_KEY;

  const sessionCache = new Map<number, string>();

  const getSession = (userId: number) => {
    if (sessionCache.has(userId)) {
      return sessionCache.get(userId)!;
    }

    const session = randomUUID();
    sessionCache.set(userId, session);
    return session;
  };

  const suggest = async (query: string, userId: number): Promise<SuggestResult> => {
    const url = new URL('https://suggest-maps.yandex.ru/v1/suggest');
    url.searchParams.set('apikey', suggestApiKey);
    url.searchParams.set('text', query);
    url.searchParams.set('highlight', '0');
    url.searchParams.set('sessiontoken', getSession(userId));
    url.searchParams.set('attrs', 'uri');
    url.searchParams.set('ll', '38.871501,47.234551');

    const suggestionsResult = await fromPromise(
      ky.get<SuggestApiResponse>(url).json(),
      (e) => e
    );

    if (suggestionsResult.isErr()) {
      console.error('Yandex suggest error', suggestionsResult.error);
      return err(suggestionsResult.error);
    }

    const suggestions = suggestionsResult.value.results.map((item) => ({
      title: item.title.text,
      subtitle: item.subtitle?.text ?? '',
      uri: item.uri,
    }));

    return ok(suggestions);
  };

  const geocode = async (uri: string): Promise<GeocodeResult> => {
    const url = new URL('https://geocode-maps.yandex.ru/v1');
    url.searchParams.set('apikey', geocoderApiKey);
    url.searchParams.set('uri', uri);
    url.searchParams.set('format', 'json');

    const geocoderResult = await fromPromise(
      ky.get<GeocoderApiResponse>(url).json(),
      (e) => e
    );

    if (geocoderResult.isErr()) {
      console.error('Yandex geocode error', geocoderResult.error);
      return err(geocoderResult.error);
    }

    const geoObjectCollection = geocoderResult.value.response.GeoObjectCollection;
    const geoObject = geoObjectCollection.featureMember.at(0)?.GeoObject;

    if (!geoObject) {
      console.error('No geo object found in geocode response', uri);
      return err(new Error('No geo object found'));
    }

    const [longitude, latitude] = geoObject.Point.pos.split(' ').map(Number);
    return ok({
      latitude,
      longitude,
    });
  };

  fastify.decorate('yandexMaps', {
    suggest,
    geocode,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    yandexMaps: {
      suggest: (query: string, userId: number) => Promise<SuggestResult>;
      geocode: (uri: string) => Promise<GeocodeResult>;
    };
  }
}
