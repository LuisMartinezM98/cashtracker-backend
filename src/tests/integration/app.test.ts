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
import * as authUtils from "../../utils/auth";
import * as jwtUtils from "../../utils/jwt";
import Budget from "../../models/Budget";

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
  beforeEach(() => {
    jest.clearAllMocks();
  })
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
  it("should should return a 403 error if user is not confirmed", async () => {
    const userData = {
      name: "test",
      email: "user_not_confirmed@test.com",
      password: "password",
    };
    await request(server).post("/api/auth/create-account").send(userData);
    const response = await request(server).post("/api/auth/login").send({
      password: userData.password,
      email: userData.email,
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
  it("should should return a 401 error if password is incorrect", async () => {
    const findOne = (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue({
      id: 1,
      confirmed: true,
      password: "hashedPassword",
      email: "user_confirmed@test.com",
      name: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const checkPassword = jest.spyOn(authUtils, "checkPassword").mockResolvedValue(false);

    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "user_confirmed@test.com",
    });
    const loginMock = jest.spyOn(AuthController, "login");

    expect(response.status).toBe(401);
    expect(response.status).not.toBe(404);
    expect(response.status).not.toBe(200);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Invalid password");
    expect(response.body).not.toHaveProperty("errors");

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ where: { email: "user_confirmed@test.com" } });
    expect(checkPassword).toHaveBeenCalledTimes(1);
    expect(checkPassword).toHaveBeenCalledWith("password", "hashedPassword");


  });
  it("should should return a JWT", async () => {
    const findOne = (jest.spyOn(User, "findOne") as jest.Mock).mockResolvedValue({
      id: 1,
      confirmed: true,
      password: "hashedPassword",
    });
    const checkPassword = jest.spyOn(authUtils, "checkPassword").mockResolvedValue(true);
    const generateJWT = jest.spyOn(jwtUtils, "generateJWT").mockReturnValue("mocked-jwt-token");

    const response = await request(server).post("/api/auth/login").send({
      password: "password",
      email: "user_confirmed@test.com",
    });

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(404);
    expect(response.status).not.toBe(401);
    expect(response.body).toEqual("mocked-jwt-token");
    expect(response.body).not.toHaveProperty("error");
    expect(response.body).not.toHaveProperty("errors");

    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ where: { email: "user_confirmed@test.com" } });
    expect(checkPassword).toHaveBeenCalledTimes(1);
    expect(checkPassword).toHaveBeenCalledWith("password", "hashedPassword");
    expect(generateJWT).toHaveBeenCalledTimes(1);
    expect(generateJWT).toHaveBeenCalledWith(1);

  });
});
let jwt: string;
async function authenticateUser() {
  const response = await request(server).post("/api/auth/login").send({
    password: "12345678",
    email: "test@test.com",
  });
  jwt = response.body;
  expect(response.status).toBe(200);
  expect(jwt).toBeDefined();
}

describe("GET /api/budgets", () => {
  beforeAll(() => {
    jest.restoreAllMocks();
  })

  beforeAll(async () => {
    await authenticateUser();
  });


  it('should reject unathenticated acces to budgets without a jwt', async () => {
    const response = await request(server).get("/api/budgets");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Unauthorized");
  });

  it('should reject unathenticated acces to budgets with a invalid a jwt', async () => {
    const response = await request(server).get("/api/budgets").auth("invalid_jwt_token", { type: "bearer" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Failed to get user");
  });

  it('should allow authenticated access to budgets with a valid jwt', async () => {
    const response = await request(server).get("/api/budgets").auth(jwt, { type: "bearer" });

    expect(response.status).not.toBe(401);
    expect(response.body).not.toHaveProperty("error");
    expect(response.body).toHaveLength(0);
    expect(response.status).toBe(200);
  });
})

describe("POST /api/budgets", () => {


  beforeAll(async () => {
    await authenticateUser();
  });

  it('should reject unathenticated post request to budgets without a jwt', async () => {
    const response = await request(server).post("/api/budgets");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Unauthorized");
  });

  it('should reject unathenticated post request to budgets without a jwt', async () => {
    const response = await request(server).post("/api/budgets").auth(jwt, { type: "bearer" }).send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(4);
  });
  it('should return 500 when trying to create a budget and have a database error', async () => {
    const createSpy = jest.spyOn(Budget, "create").mockRejectedValue(new Error());

    const response = await request(server).post("/api/budgets").auth(jwt, { type: "bearer" }).send({
      name: "Budget 1",
      amount: 1000,
    });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create budget' });
    createSpy.mockRestore();
  });
});

describe("GET /api/budgets/:id", () => {

  beforeAll(async () => {
    await authenticateUser();
  });

  it('should reject unathenticated get request to budget id without a jwt', async () => {
    const response = await request(server).get("/api/budgets/1");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Unauthorized");
  });
  it('should return 400 bad request when the id is not valid', async () => {
    const response = await request(server).get("/api/budgets/not_valid").auth(jwt, { type: "bearer" });

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(401);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].msg).toBe("Invalid ID");
    expect(response.body.errors[0].path).toBe("budgetId");
    expect(response.body.errors[0].location).toBe("params");
    expect(response.body.errors[0].value).toBe("not_valid");
  });
  it("should return 404 when budget is not found", async () => {
    const response = await request(server).get("/api/budgets/4000").auth(jwt, { type: "bearer" });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Budget not found");
  });
  it("should return 200 when budget is found", async () => {
    const createResponse = await request(server).post("/api/budgets").auth(jwt, { type: "bearer" }).send({
      name: "Budget 1",
      amount: 1000,
    });
    expect(createResponse.status).toBe(201);
    const response = await request(server).get(`/api/budgets/1`).auth(jwt, { type: "bearer" });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(1);
    expect(response.body).toHaveProperty("name");
    expect(response.body.name).toBe("Budget 1");
    expect(response.body).toHaveProperty("amount");
    expect(response.body.amount).toBe("1000");
  });


  
});

describe("PUT /api/budgets/:id", () => {

  beforeAll(async () => {
    await authenticateUser();
  });

  it('should reject unathenticated put request to budget id without a jwt', async () => {
    const response = await request(server).put("/api/budgets/1");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Unauthorized");
  });

  it('should return 400 bad request when the id is not valid', async () => {
    const response = await request(server).put("/api/budgets/not_valid").auth(jwt, { type: "bearer" });

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(401);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].msg).toBe("Invalid ID");
    expect(response.body.errors[0].path).toBe("budgetId");
    expect(response.body.errors[0].location).toBe("params");
    expect(response.body.errors[0].value).toBe("not_valid");
  });

  it("should return 404 when budget is not found", async () => {
    const response = await request(server).put("/api/budgets/4000").auth(jwt, { type: "bearer" });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Budget not found");
  });

  it("should update the budget", async () => {
    const response = await request(server).put("/api/budgets/1").auth(jwt, { type: "bearer" }).send({
      name: "Updated Budget 1",
      amount: 2000,
    });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Budget updated successfully");
  });

  it('should return 500 when trying to update a budget and have a database error', async () => {

    const updateSpy = jest.spyOn(Budget.prototype, "update").mockRejectedValue(new Error());

    const response = await request(server).put("/api/budgets/1").auth(jwt, { type: "bearer" }).send({
      name: "Non-existent Budget",
      amount: 2000,
    });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update budget' });
    updateSpy.mockRestore();
  });

});

describe("DELETE /api/budgets/:id", () => {

  beforeAll(async () => {
    await authenticateUser();
  }); 

  it('should reject unathenticated delete request to budget id without a jwt', async () => {
    const response = await request(server).delete("/api/budgets/1");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Unauthorized");
  });

  it('should return 400 bad request when the id is not valid', async () => {
    const response = await request(server).put("/api/budgets/not_valid").auth(jwt, { type: "bearer" });

    expect(response.status).toBe(400);
    expect(response.status).not.toBe(401);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].type).toBe("field");
    expect(response.body.errors[0].msg).toBe("Invalid ID");
    expect(response.body.errors[0].path).toBe("budgetId");
    expect(response.body.errors[0].location).toBe("params");
    expect(response.body.errors[0].value).toBe("not_valid");
  });

  it("should return 404 when budget is not found", async () => {
    const response = await request(server).delete("/api/budgets/4000").auth(jwt, { type: "bearer" });
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Budget not found");
  });

  it('should return 500 when trying to delete a budget and have a database error', async () => {
    const destroySpy = jest.spyOn(Budget.prototype, "destroy").mockRejectedValue(new Error());

    const response = await request(server).delete("/api/budgets/1").auth(jwt, { type: "bearer" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to delete budget' });
    destroySpy.mockRestore();
  });
  it('should delete the budget', async () => {
    const response = await request(server).delete("/api/budgets/1").auth(jwt, { type: "bearer" });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Budget deleted successfully");
  });

});