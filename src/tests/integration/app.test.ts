jest.mock("nodemailer", () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest
        .fn()
        .mockResolvedValue({ messageId: "mocked-email-id-12345" }),
    }),
  };
});

import request from "supertest";
import server, { connectDB } from "../../server";
import { AuthController } from "../../controllers/AuthController";
import { db } from "../../config/db";
import User from "../../models/User";

beforeAll(async () => {
  await connectDB();
});
afterAll(async () => {
  await db.close();
});

describe("Authentication - Create Account", () => {
  it("should display validation errors when form is empty", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({});

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(3);

    expect(createAccountMock).not.toHaveBeenCalled();
  });
  it("should return 400 when email is invalid", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({
        name: "Luis",
        password: "12345678",
        email: "invalid-email",
      });

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].value).toBe("invalid-email");
    expect(response.body.errors[0].msg).toBe("Invalid email");
    expect(response.body.errors[0].path).toBe("email");
    expect(response.body.errors[0].location).toBe("body");

    expect(createAccountMock).not.toHaveBeenCalled();
  });
  it("should return 400 when password is invalid", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({
        name: "Luis",
        password: "1234567",
        email: "test@test.com",
      });

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].value).toBe("1234567");
    expect(response.body.errors[0].msg).toBe(
      "Password must be at least 8 characters",
    );
    expect(response.body.errors[0].path).toBe("password");
    expect(response.body.errors[0].location).toBe("body");

    expect(createAccountMock).not.toHaveBeenCalled();
  });
  it("should return 400 when name is empty", async () => {
    const response = await request(server)
      .post("/api/auth/create-account")
      .send({
        name: "",
        password: "12345678",
        email: "test@test.com",
      });

    const createAccountMock = jest.spyOn(AuthController, "createAccount");

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].value).toBe("");
    expect(response.body.errors[0].msg).toBe("Name is required");
    expect(response.body.errors[0].path).toBe("name");
    expect(response.body.errors[0].location).toBe("body");

    expect(createAccountMock).not.toHaveBeenCalled();
  });
  it("should return 201 when form is valid", async () => {
    const userData = {
      name: "name",
      password: "12345678",
      email: "test@test.com",
    };
    const response = await request(server)
      .post("/api/auth/create-account")
      .send(userData);

    expect(response.status).toBe(201);

    expect(response.status).not.toBe(400);
    expect(response.body.errors).toBe(undefined);
  });
  it("should return 409 user already exists", async () => {
    const userData = {
      name: "name",
      password: "12345678",
      email: "test@test.com",
    };
    const response = await request(server)
      .post("/api/auth/create-account")
      .send(userData);

    expect(response.status).toBe(409);

    expect(response.status).not.toBe(201);
    expect(response.status).not.toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("User already exists");
    expect(response.body).not.toHaveProperty("errors");
  });
});
describe("Authentication - Account Confirmation with Token", () => {
  it("should display error if token is empty or token is not valid", async () => {
    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({
        token: "not_valid",
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].value).toBe("not_valid");
    expect(response.body.errors[0].msg).toBe("Invalid token");
    expect(response.body.errors[0].path).toBe("token");
    expect(response.body.errors[0].location).toBe("body");
  });
  it("should display error if token is not valid", async () => {
    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({
        token: "123456",
      });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.errors).toBe(undefined);
    expect(response.body.error).toBe("Invalid token");
  });
  it("should confirm account with valid token", async () => {
    const token = globalThis.cashTrackrConfirmationToken;
    const response = await request(server)
      .post("/api/auth/confirm-account")
      .send({
        token,
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual("Account confirmed successfully");
    expect(response.body).not.toHaveProperty("error");
    expect(response.body).not.toHaveProperty("errors");
  });
});

describe("Authentication - Login", () => {
  it("should display validation errors when the fomr is empty", async () => {
    const response = await request(server).post("/api/auth/login").send({});
    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(2);

    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].msg).toBe("Invalid email");
    expect(response.body.errors[0].path).toBe("email");
    expect(response.body.errors[0].location).toBe("body");
    expect(response.body.errors[1].type).toBe("field");
    expect(response.body.errors[1].msg).toBe("Password is required");
    expect(response.body.errors[1].path).toBe("password");
    expect(response.body.errors[1].location).toBe("body");

    expect(loginMock).not.toHaveBeenCalled();
  });
  it("should retirm 400 badn request when the emails is invalid", async () => {
    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "not_valid",
    });
    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);

    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].msg).toBe("Invalid email");
    expect(response.body.errors[0].path).toBe("email");
    expect(response.body.errors[0].location).toBe("body");
    expect(response.body.errors[0].value).toBe("not_valid");

    // expect(response.body.errors[1].type).toBe("field");

    expect(loginMock).not.toHaveBeenCalled();
  });
  it("should should return a 404 error if the user is not found", async () => {
    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "user_not_found@test.com",
    });
    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.status).toBe(404);
    expect(response.status).not.toBe(200);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("User does not exist");
    expect(response.body).not.toHaveProperty("errors");

    expect(loginMock).not.toHaveBeenCalled();
  });
  it("should should return a 403 error if user is not confirmed", async () => {
    (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue({
      id: 1,
      confirmed: false,
      password: "hashedPassword",
      email: "user_not_confirmed@test.com",
      name: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "user_not_confirmed@test.com",
    });
    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.status).toBe(403);
    expect(response.status).not.toBe(404);
    expect(response.status).not.toBe(200);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Account not confirmed");
    expect(response.body).not.toHaveProperty("errors");

    expect(loginMock).not.toHaveBeenCalled();
  });
});
