import { createRequest, createResponse } from "node-mocks-http";
import { AuthController } from "../../../controllers/AuthController";
import User from "../../../models/User";
import { checkPassword, hashPassword } from "../../../utils/auth";
import { generateToken } from "../../../utils/token";
import { AuthEmail } from "../../../emails/AuthEmail";
import { generateJWT } from "../../../utils/jwt";

jest.mock("../../../models/User");
jest.mock("../../../utils/auth");
jest.mock("../../../utils/token");
jest.mock("../../../utils/jwt");

describe("AuthController.createAccount", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("should return a 409 status and an error message if the email is already registered", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(true);
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    await AuthController.createAccount(req, res);
    const data = res._getJSONData();
    expect(data).toHaveProperty("error", "User already exists");
    expect(res.statusCode).toBe(409);
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(User.findOne).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
    });
  });
  it("should register a new user and return a success message", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        email: "test@test.com",
        password: "testpassword123",
        name: "Test Name",
      },
    });
    const res = createResponse();
    const mockUser = { ...req.body, save: jest.fn() };
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (hashPassword as jest.Mock).mockResolvedValue("hashedPassword");
    (generateToken as jest.Mock).mockReturnValue("123456");
    jest
      .spyOn(AuthEmail, "sendConfirmation")
      .mockImplementation(() => Promise.resolve());

    await AuthController.createAccount(req, res);
    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual({
      message: "Account created successfully",
    });
    expect(User.create).toHaveBeenCalledTimes(1);
    expect(User.create).toHaveBeenCalledWith(req.body);
    expect(hashPassword).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledWith("testpassword123");
    expect(mockUser.password).toBe("hashedPassword");
    expect(mockUser.token).toBe("123456");
    expect(generateToken).toHaveBeenCalledTimes(1);
    expect(AuthEmail.sendConfirmation).toHaveBeenCalledTimes(1);
    expect(AuthEmail.sendConfirmation).toHaveBeenCalledWith({
      name: "Test Name",
      email: "test@test.com",
      token: "123456",
    });
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });
  it("should return a 500 status and an error message if an error occurs", async () => {
    const req = createRequest({
      method: "POST",
      url: "/api/auth/register",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    await AuthController.createAccount(req, res);
    const data = res._getJSONData();
    expect(res.statusCode).toBe(500);
    expect(data).toHaveProperty("error", "Failed to create account");
    expect(User.findOne).toHaveBeenCalledTimes(1);
  })
});

describe("AuthController.login", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("should return a 404 status if user is not found", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    await AuthController.login(req, res);
    const data = res._getJSONData();
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(404);
    expect(data).toHaveProperty("error", "User does not exist");
  });
  it("should return a 403 status if user account is not confirmed", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      confirmed: false,
      email: "test@test.com",
      password: "testpassword123",
    });
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    await AuthController.login(req, res);
    const data = res._getJSONData();
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(403);
    expect(data).toHaveProperty("error", "Account not confirmed");
  });
  it("should return a 401 status if user password is invalid", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      confirmed: true,
      email: "test@test.com",
      password: "testpassword",
    });
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    (checkPassword as jest.Mock).mockResolvedValue(false);
    await AuthController.login(req, res);
    const data = res._getJSONData();
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(401);
    expect(data).toHaveProperty("error", "Invalid password");
    expect(checkPassword).toHaveBeenCalledTimes(1);
    expect(checkPassword).toHaveBeenCalledWith(
      "testpassword123",
      "testpassword",
    );
  });
  it("should return jwt token if user is valid", async () => {
    const userMock = {
      id: 1,
      confirmed: true,
      email: "test@test.com",
      password: "hashedpassword",
    };
    const req = createRequest({
      method: "POST",
      url: "/api/auth/login",
      body: {
        email: "test@test.com",
        password: "testpassword123",
      },
    });
    const res = createResponse();
    const fakejwt = "fake_jwt";
    (User.findOne as jest.Mock).mockResolvedValue(userMock);
    (checkPassword as jest.Mock).mockResolvedValue(true);
    (generateJWT as jest.Mock).mockReturnValue(fakejwt);

    await AuthController.login(req, res);

    const data = res._getJSONData();
    expect(res.statusCode).toBe(200);
    expect(data).toEqual(fakejwt);
    expect(generateJWT).toHaveBeenCalledTimes(1);
    expect(generateJWT).toHaveBeenCalledWith(userMock.id);
    expect(User.findOne).toHaveBeenCalledTimes(1);
  });
});
