<div className="flex flex-wrap gap-2 text-sm">
                  <Link href={"/teacher/mocks/" + m.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy text-white hover:bg-blue-900 transition">
                    Questions
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/results"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition">
                    Results
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/assign"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition">
                    Assign
                  </Link>
                  <Link href={"/teacher/mocks/" + m.id + "/leaderboard"}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition">
                    Leaderboard
                  </Link>
                  <button onClick={() => setEditingMock(m)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(m.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition ml-auto">
                    Delete
                  </button>
                </div>