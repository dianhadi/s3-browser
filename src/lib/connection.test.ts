import { describe, expect, test } from "vitest";
import {
  getAddressingStyleLabel,
  getEndpointDetails,
  maskAccessKey,
  normalizeConnectionInput,
  normalizeEndpoint,
  type ConnectionInput,
} from "./connection";

describe("connection helpers", () => {
  test("normalizeEndpoint strips path, query, hash, and trailing slash", () => {
    expect(
      normalizeEndpoint("http://127.0.0.1:9000/bucket/path?x=1#frag"),
    ).toBe("http://127.0.0.1:9000");
  });

  test("normalizeConnectionInput trims fields and preserves addressing style", () => {
    const input: ConnectionInput = {
      endpoint: " http://localhost:9000/ ",
      region: " us-east-1 ",
      accessKeyId: " minioadmin ",
      secretAccessKey: " secret ",
      addressingStyle: "path",
    };

    expect(normalizeConnectionInput(input)).toEqual({
      endpoint: "http://localhost:9000",
      region: "us-east-1",
      accessKeyId: "minioadmin",
      secretAccessKey: "secret",
      addressingStyle: "path",
    });
  });

  test("getEndpointDetails identifies localhost and ip addresses", () => {
    expect(getEndpointDetails("http://localhost:9000")).toMatchObject({
      protocol: "http",
      hostname: "localhost",
      port: "9000",
      isLocalhost: true,
      isIpAddress: false,
    });

    expect(getEndpointDetails("https://10.10.10.10:9443")).toMatchObject({
      protocol: "https",
      hostname: "10.10.10.10",
      port: "9443",
      isLocalhost: false,
      isIpAddress: true,
    });
  });

  test("maskAccessKey redacts the middle of the access key", () => {
    expect(maskAccessKey("ABCD1234")).toBe("AB****34");
  });

  test("getAddressingStyleLabel returns a readable label", () => {
    expect(getAddressingStyleLabel("path")).toBe("Path-style");
    expect(getAddressingStyleLabel("virtual")).toBe("Virtual-hosted");
  });
});
