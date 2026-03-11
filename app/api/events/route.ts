import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Event from "@/lib/models/Event";

export async function GET() {
  // TODO: restore when MongoDB is connected
  // try {
  //   await connectDB();
  //   const events = await Event.find().sort({ date: 1 }).lean();
  //   return NextResponse.json(events);
  // } catch {
  //   return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  // }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  // TODO: restore when MongoDB is connected
  // try {
  //   await connectDB();
  //   const body = await req.json();
  //   const { title, description, date, location, capacity } = body;
  //   if (!title || !description || !date || !location || !capacity) {
  //     return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  //   }
  //   const event = await Event.create({ title, description, date, location, capacity });
  //   return NextResponse.json(event, { status: 201 });
  // } catch {
  //   return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  // }
  const body = await req.json();
  return NextResponse.json({ _id: "mock-id", ...body }, { status: 201 });
}
