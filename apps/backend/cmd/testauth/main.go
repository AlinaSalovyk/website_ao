package main

import (
	"fmt"
	"university-chatbot/backend/internal/infrastructure/auth"
)

func main() {
	jwtSvc := auth.NewJWTService("a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")
	user := &auth.GoogleUserInfo{
		Email: "nazarii.voitiuk@oa.edu.ua", // Or another email in ALLOWED_EMAILS
		Name:  "Nazarii",
	}
	token, _ := jwtSvc.GenerateRefreshToken(user)
	fmt.Print(token)
}
